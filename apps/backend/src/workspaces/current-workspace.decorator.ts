import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { RequestWorkspace } from "./workspace.guard";

/**
 * Reads the active workspace attached by WorkspaceGuard.
 *   @CurrentWorkspace() ws: RequestWorkspace   // { id, role }
 *   @CurrentWorkspace("id") workspaceId: string
 */
export const CurrentWorkspace = createParamDecorator(
  (data: keyof RequestWorkspace | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const workspace: RequestWorkspace | undefined = request.workspace;
    return data ? workspace?.[data] : workspace;
  }
);
