import { Injectable, Logger } from "@nestjs/common";
import { Resend } from "resend";
import { PrismaService } from "../prisma/prisma.service";

const COOLDOWN_MS = 5 * 60 * 1000; // don't re-email the same conversation within 5 min

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly resend: Resend | null;
  private readonly from: string;
  // conversationId -> last notified timestamp (in-memory, single-instance beta)
  private readonly lastNotified = new Map<string, number>();

  constructor(private prisma: PrismaService) {
    const apiKey = process.env.RESEND_API_KEY;
    this.from = process.env.EMAIL_FROM ?? "";
    this.resend = apiKey ? new Resend(apiKey) : null;

    if (!this.resend || !this.from) {
      this.logger.warn(
        "Resend not configured — offline email notifications disabled (set RESEND_API_KEY + EMAIL_FROM)."
      );
    }
  }

  /**
   * Email every member of a workspace that a visitor sent a message while no
   * agent was online. Rate-limited per conversation, no-op without config.
   */
  async notifyOfflineAgents(params: {
    workspaceId: string;
    conversationId: string;
    snippet: string;
    nowMs: number;
  }): Promise<void> {
    if (!this.resend || !this.from) return;

    const last = this.lastNotified.get(params.conversationId);
    if (last && params.nowMs - last < COOLDOWN_MS) return;
    this.lastNotified.set(params.conversationId, params.nowMs);

    const memberships = await this.prisma.membership.findMany({
      where: { workspaceId: params.workspaceId },
      include: { user: { select: { email: true } } },
    });
    const recipients = memberships.map((m) => m.user.email).filter(Boolean);
    if (recipients.length === 0) return;

    const text = params.snippet.slice(0, 140);
    try {
      await this.resend.emails.send({
        from: this.from,
        to: recipients,
        subject: "Tin nhắn mới từ khách (bạn đang offline)",
        html: this.buildHtml(text),
      });
      this.logger.log(
        `Offline email sent to ${recipients.length} member(s) for conversation ${params.conversationId}`
      );
    } catch (err) {
      this.logger.error("Failed to send offline email", err as Error);
    }
  }

  /** Forget a conversation's cooldown once an agent comes back online. */
  clearCooldownForWorkspace(): void {
    // Simple beta strategy: clear all cooldowns when any admin reconnects.
    this.lastNotified.clear();
  }

  private buildHtml(snippet: string): string {
    return `
      <div style="font-family: system-ui, sans-serif; max-width: 480px;">
        <h2 style="margin:0 0 12px;">Bạn có tin nhắn mới</h2>
        <p style="color:#374151;">Một khách vừa nhắn khi không có nhân viên nào online:</p>
        <blockquote style="margin:12px 0;padding:12px 16px;background:#f3f4f6;border-radius:8px;color:#111827;">
          ${this.escape(snippet)}
        </blockquote>
        <p style="color:#6b7280;font-size:13px;">Mở dashboard để trả lời.</p>
      </div>
    `;
  }

  private escape(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}
