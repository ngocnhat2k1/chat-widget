import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Role } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export interface RequestWorkspace {
  id: string;
  role: Role;
}

/**
 * Resolves the active workspace for an authenticated request and verifies the
 * current user is a member of it. Must run AFTER JwtAuthGuard (needs req.user).
 *
 * Workspace id is taken from the `X-Workspace-Id` header (ambient context for
 * websites/conversations/analytics) or, as a fallback, a `:workspaceId` route
 * param (workspace detail/update routes). NOTE: it deliberately does NOT read a
 * generic `:id` param — on resource controllers `:id` is the resource id, not a
 * workspace id, and reading it would break tenant scoping.
 *
 * On success attaches `req.workspace = { id, role }` (read via @CurrentWorkspace()).
 */
@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException("Authentication required");
    }

    // A `:workspaceId` route param identifies the workspace being operated on
    // directly, so it takes precedence over the ambient header — otherwise a
    // member of workspace B could send `X-Workspace-Id: B` while targeting
    // `/workspaces/A`, passing the guard but mutating A.
    const headerId = req.headers?.["x-workspace-id"];
    const workspaceId: string | undefined =
      req.params?.workspaceId ||
      (Array.isArray(headerId) ? headerId[0] : headerId);

    if (!workspaceId) {
      throw new ForbiddenException(
        "Missing workspace context (X-Workspace-Id)"
      );
    }

    const membership = await this.prisma.membership.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    if (!membership) {
      throw new ForbiddenException("Not a member of this workspace");
    }

    req.workspace = { id: workspaceId, role: membership.role };
    return true;
  }
}
