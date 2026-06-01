import * as bcrypt from "bcrypt";
import { WebsitesService } from "./websites.service";
import { PrismaService } from "../prisma/prisma.service";

describe("WebsitesService.validateApiKey", () => {
  let service: WebsitesService;
  let prisma: { apiKey: { findMany: jest.Mock; update: jest.Mock } };
  const PLAIN_KEY = "real-api-key-123";
  let hashedKey: string;

  beforeAll(() => {
    hashedKey = bcrypt.hashSync(PLAIN_KEY, 10);
  });

  beforeEach(() => {
    prisma = {
      apiKey: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "k1",
            hashedKey,
            website: { id: "w1", domain: "example.com", workspaceId: "ws1" },
          },
        ]),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    service = new WebsitesService(prisma as unknown as PrismaService);
  });

  it("accepts a valid key on the matching domain", async () => {
    const res = await service.validateApiKey(PLAIN_KEY, "example.com");

    expect(res.isValid).toBe(true);
    expect(res.website?.id).toBe("w1");
    expect(prisma.apiKey.update).toHaveBeenCalled(); // lastUsed bumped
  });

  it("rejects a valid key on the wrong domain", async () => {
    const res = await service.validateApiKey(PLAIN_KEY, "evil.com");

    expect(res.isValid).toBe(false);
    expect(prisma.apiKey.update).not.toHaveBeenCalled();
  });

  it("rejects an invalid key", async () => {
    const res = await service.validateApiKey("wrong-key", "example.com");

    expect(res.isValid).toBe(false);
  });
});
