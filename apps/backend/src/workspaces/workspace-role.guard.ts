import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  mixin,
  Type,
} from "@nestjs/common";
import { Role } from "@prisma/client";
import { RequestWorkspace } from "./workspace.guard";

/**
 * Factory guard that gates a route to specific workspace roles.
 * Must run AFTER WorkspaceGuard (needs req.workspace).
 *
 *   @UseGuards(JwtAuthGuard, WorkspaceGuard, WorkspaceRoleGuard([Role.OWNER, Role.ADMIN]))
 */
export function WorkspaceRoleGuard(allowed: Role[]): Type<CanActivate> {
  @Injectable()
  class RoleGuardMixin implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const req = context.switchToHttp().getRequest();
      const workspace: RequestWorkspace | undefined = req.workspace;

      if (!workspace || !allowed.includes(workspace.role)) {
        throw new ForbiddenException(
          `Requires workspace role: ${allowed.join(" or ")}`
        );
      }
      return true;
    }
  }

  return mixin(RoleGuardMixin);
}
