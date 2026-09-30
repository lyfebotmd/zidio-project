import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. Create or find the demo workspace using name
  let workspace = await prisma.workspace.findFirst({
    where: { name: "Zidio Demo Workspace" },
  });

  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        name: "Zidio Demo Workspace",
      },
    });
  }

  // 2. Create or update the test user with passwordHash
  const user = await prisma.user.upsert({
    where: { email: "admin@zidio.com" },
    update: {},
    create: {
      email: "admin@zidio.com",
      name: "Zidio Admin",
      passwordHash: "demo_password_hash", // Required by schema
      workspaceId: workspace.id,
      role: "ADMIN",
    },
  });

  console.log("Database seeded successfully!");
  console.log(`Created Workspace ID: ${workspace.id}`);
  console.log(`Created User Email: ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });