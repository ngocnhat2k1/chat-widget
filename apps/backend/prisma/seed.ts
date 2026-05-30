import { PrismaClient, Role } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create a demo user
  const hashedPassword = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      passwordHash: hashedPassword,
    },
  });

  console.log("✅ Created user:", user.email);

  // Create a demo workspace + OWNER membership for the demo user
  const workspace = await prisma.workspace.upsert({
    where: { slug: "demo-workspace" },
    update: {},
    create: {
      id: "demo-workspace-id",
      name: "Demo Workspace",
      slug: "demo-workspace",
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_workspaceId: { userId: user.id, workspaceId: workspace.id },
    },
    update: {},
    create: {
      userId: user.id,
      workspaceId: workspace.id,
      role: Role.OWNER,
    },
  });

  console.log(
    "✅ Created workspace:",
    workspace.slug,
    "(OWNER:",
    user.email + ")"
  );

  // Create a demo website owned by the workspace
  const website = await prisma.website.upsert({
    where: { id: "demo-website-id" },
    update: { workspaceId: workspace.id },
    create: {
      id: "demo-website-id",
      workspaceId: workspace.id,
      name: "Demo Website",
      domain: "localhost:5173",
    },
  });

  console.log("✅ Created website:", website.name);

  // Create a demo API key
  const hashedApiKey = await bcrypt.hash("demo-api-key-12345", 10);

  await prisma.apiKey.upsert({
    where: { hashedKey: hashedApiKey },
    update: {},
    create: {
      websiteId: website.id,
      hashedKey: hashedApiKey,
      name: "Demo API Key",
    },
  });

  console.log("✅ Created API key for demo");
  console.log("🔑 API Key (save this):", "demo-api-key-12345");

  console.log("🎉 Seeding completed!");
  console.log("");
  console.log("🔐 Login credentials:");
  console.log("   Email: admin@example.com");
  console.log("   Password: password123");
  console.log("");
  console.log("🌐 Test API Key: demo-api-key-12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
