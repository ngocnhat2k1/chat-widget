import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateWorkspaceDto } from "./dto/workspace.dto";

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Workspaces the user belongs to, with the user's role in each.
   * This is the bootstrap endpoint the admin client calls right after login.
   */
  async findAllForUser(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            _count: { select: { websites: true, memberships: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      role: m.role,
      createdAt: m.workspace.createdAt,
      websiteCount: m.workspace._count.websites,
      memberCount: m.workspace._count.memberships,
    }));
  }

  async findOne(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { _count: { select: { websites: true, memberships: true } } },
    });

    if (!workspace) {
      throw new NotFoundException("Workspace not found");
    }

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      createdAt: workspace.createdAt,
      websiteCount: workspace._count.websites,
      memberCount: workspace._count.memberships,
    };
  }

  async update(workspaceId: string, dto: UpdateWorkspaceDto) {
    if (dto.slug) {
      const existing = await this.prisma.workspace.findUnique({
        where: { slug: dto.slug },
      });
      if (existing && existing.id !== workspaceId) {
        throw new ConflictException("Slug already taken");
      }
    }

    const workspace = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: dto,
    });

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      createdAt: workspace.createdAt,
    };
  }
}
