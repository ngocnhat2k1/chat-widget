import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a demo user
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: hashedPassword,
    },
  });

  console.log('✅ Created user:', user.email);

  // Create a demo website
  const website = await prisma.website.upsert({
    where: { id: 'demo-website-id' },
    update: {},
    create: {
      id: 'demo-website-id',
      userId: user.id,
      name: 'Demo Website',
      domain: 'localhost:5173',
    },
  });

  console.log('✅ Created website:', website.name);

  // Create a demo API key
  const hashedApiKey = await bcrypt.hash('demo-api-key-12345', 10);
  
  const apiKey = await prisma.apiKey.upsert({
    where: { hashedKey: hashedApiKey },
    update: {},
    create: {
      websiteId: website.id,
      hashedKey: hashedApiKey,
      name: 'Demo API Key',
    },
  });

  console.log('✅ Created API key for demo');
  console.log('🔑 API Key (save this):', 'demo-api-key-12345');

  console.log('🎉 Seeding completed!');
  console.log('');
  console.log('🔐 Login credentials:');
  console.log('   Email: admin@example.com');
  console.log('   Password: password123');
  console.log('');
  console.log('🌐 Test API Key: demo-api-key-12345');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
