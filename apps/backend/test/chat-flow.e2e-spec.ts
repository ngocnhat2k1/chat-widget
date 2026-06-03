import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { AddressInfo } from "net";
import request from "supertest";
import { io, Socket } from "socket.io-client";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

function waitConnect(socket: Socket): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.once("connect", () => resolve());
    socket.once("connect_error", (err) =>
      reject(new Error(`connect_error: ${err.message}`))
    );
    socket.once("disconnect", (reason) =>
      reject(new Error(`disconnected before ready: ${reason}`))
    );
  });
}

function onceEvent<T = unknown>(
  socket: Socket,
  event: string,
  ms = 8000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`timed out waiting for "${event}"`)),
      ms
    );
    socket.once(event, (data: T) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// The widget is only marked authenticated after the server finishes an async
// apiKey check (bcrypt, cost 12 — noticeably slower on CI). Until then,
// createConversation is rejected with an "error". Retry (using the handler's
// ack — Nest returns the conversation) until it lands, instead of racing a
// fixed delay. The handler dedupes by (websiteId, visitorId), so retries are
// idempotent.
async function createConversationWhenReady(
  widget: Socket,
  payload: Record<string, unknown>,
  deadlineMs = 12000
): Promise<{ id: string }> {
  const stopAt = Date.now() + deadlineMs;
  while (Date.now() < stopAt) {
    const ack = await new Promise<{ id?: string } | null>((resolve) => {
      widget
        .timeout(1000)
        .emit("createConversation", payload, (err: unknown, res: unknown) =>
          resolve(err ? null : (res as { id?: string }))
        );
    });
    if (ack && ack.id) return ack as { id: string };
    await delay(100);
  }
  throw new Error("createConversation never succeeded (widget never ready)");
}

// Full critical path against a real Postgres + real Socket.IO server:
// register → workspace → website → API key (REST), then widget → admin realtime.
describe("Chat flow (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let baseUrl: string;

  const email = `e2e-${Date.now()}@example.com`;
  const password = "password123";
  const domain = "e2e-widget.example.com";

  let token: string;
  let workspaceId: string;
  let websiteId: string;
  let apiKey: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    // Mirror main.ts so DTO validation behaves like production.
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );
    prisma = app.get(PrismaService);

    // Listen on a random free port so socket.io-client has a real server.
    await app.listen(0);
    const { port } = app.getHttpServer().address() as AddressInfo;
    baseUrl = `http://localhost:${port}`;
  });

  afterAll(async () => {
    // Best-effort cleanup; cascades remove websites/keys/conversations/messages.
    if (prisma) {
      if (workspaceId) {
        await prisma.workspace
          .delete({ where: { id: workspaceId } })
          .catch(() => undefined);
      }
      await prisma.user.delete({ where: { email } }).catch(() => undefined);
    }
    await app?.close();
  });

  it("register → workspace → website → API key (REST)", async () => {
    const server = app.getHttpServer();

    const reg = await request(server)
      .post("/api/auth/register")
      .send({ email, password })
      .expect(201);
    token = reg.body.accessToken;
    expect(token).toBeTruthy();

    // Bootstrap endpoint: the new user owns exactly one auto-created workspace.
    const wsRes = await request(server)
      .get("/api/workspaces")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(wsRes.body)).toBe(true);
    expect(wsRes.body).toHaveLength(1);
    expect(wsRes.body[0].role).toBe("OWNER");
    workspaceId = wsRes.body[0].id;

    const siteRes = await request(server)
      .post("/api/websites")
      .set("Authorization", `Bearer ${token}`)
      .set("X-Workspace-Id", workspaceId)
      .send({ name: "E2E Site", domain })
      .expect(201);
    websiteId = siteRes.body.id;
    expect(websiteId).toBeTruthy();

    const keyRes = await request(server)
      .post(`/api/websites/${websiteId}/api-keys`)
      .set("Authorization", `Bearer ${token}`)
      .set("X-Workspace-Id", workspaceId)
      .send({ name: "e2e-key" })
      .expect(201);
    apiKey = keyRes.body.key; // plaintext, returned only on creation
    expect(apiKey).toBeTruthy();
  });

  it("widget message reaches the admin in realtime (WS)", async () => {
    const admin = io(baseUrl, {
      transports: ["websocket"],
      reconnection: false,
      auth: { token, workspaceId },
    });
    const widget = io(baseUrl, {
      transports: ["websocket"],
      reconnection: false,
      auth: { apiKey, domain },
    });

    try {
      await Promise.all([waitConnect(admin), waitConnect(widget)]);

      // Retry until the widget's async auth has settled (see helper). The admin
      // room join has no bcrypt, so it's done well before this returns.
      const created = await createConversationWhenReady(widget, {
        websiteId,
        visitorId: "visitor-e2e",
      });
      expect(created.id).toBeTruthy();

      // The core assertion: a visitor message must reach the admin's room.
      // Listener is registered before the emit so we never miss the broadcast.
      const adminMessage = onceEvent<{ content: string; senderType: string }>(
        admin,
        "receiveMessage"
      );
      widget.emit("sendMessage", {
        conversationId: created.id,
        content: "hello from the visitor",
        senderType: "VISITOR",
      });

      const received = await adminMessage;
      expect(received.content).toBe("hello from the visitor");
      expect(received.senderType).toBe("VISITOR");
    } finally {
      admin.disconnect();
      widget.disconnect();
    }
  });
});
