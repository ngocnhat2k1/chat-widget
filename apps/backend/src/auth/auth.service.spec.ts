import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";

describe("AuthService.login", () => {
  let service: AuthService;
  let prisma: { user: { findUnique: jest.Mock } };
  let jwt: { sign: jest.Mock };
  let passwordHash: string;

  beforeAll(() => {
    passwordHash = bcrypt.hashSync("password123", 10);
  });

  beforeEach(() => {
    prisma = { user: { findUnique: jest.fn() } };
    jwt = { sign: jest.fn().mockReturnValue("signed.jwt.token") };
    service = new AuthService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService
    );
  });

  it("returns a token for correct credentials", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      passwordHash,
      createdAt: new Date(),
    });

    const res = await service.login({
      email: "a@b.com",
      password: "password123",
    });

    expect(res.accessToken).toBe("signed.jwt.token");
    expect(res.user.email).toBe("a@b.com");
    expect(jwt.sign).toHaveBeenCalledWith({ sub: "u1", email: "a@b.com" });
  });

  it("rejects a wrong password", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      passwordHash,
      createdAt: new Date(),
    });

    await expect(
      service.login({ email: "a@b.com", password: "wrong" })
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects a non-existent user", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({ email: "nope@b.com", password: "password123" })
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
