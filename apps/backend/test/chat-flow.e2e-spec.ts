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
      // Give the gateway a beat to finish joining the admin room before we emit.
      await delay(200);

      // Listeners registered before the emit so we never miss the broadcast.
      const adminConversation = onceEvent(admin, "conversationCreated");
      const widgetConversation = onceEvent<{ id: string }>(
        widget,
        "conversationCreated"
      );

      widget.emit("createConversation", {
        websiteId,
        visitorId: "visitor-e2e",
      });

      const created = await widgetConversation;
      await adminConversation; // admin is notified of the new conversation too
      expect(created.id).toBeTruthy();

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
