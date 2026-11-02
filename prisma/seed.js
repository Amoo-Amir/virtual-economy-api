const { PrismaClient } = require("@prisma/client");

require("dotenv").config();
const treasuryCode = process.env.GAME_TREASURY_CODE;
const treasuryName = process.env.GAME_TREASURY_NAME;

const prisma = new PrismaClient();

async function main() {
  if (!process.env.GAME_TREASURY_CODE || !process.env.GAME_TREASURY_NAME) {
    throw new Error("Missing GAME_TREASURY environment variables");
  }

  const treasury = await prisma.system_accounts.upsert({
    where: {
      code: treasuryCode,
    },

    update: {
      name: treasuryName,
    },

    create: {
      code: treasuryCode,
      name: treasuryName,
    },
  });

  console.log("System account seeded successfully:");

  const items = [
    {
      name: "Iron Sword",
      description: "A basic iron sword",
    },
    {
      name: "Health Potion",
      description: "Restores a small amount of health",
    },
    {
      name: "Golden Shield",
      description: "A shield made of gold",
    },
    {
      name: "Magic Crystal",
      description: "A mysterious magical crystal",
    },
  ];

  for (const item of items) {
    await prisma.items.upsert({
      where: {
        name: item.name,
      },
      update: {
        description: item.description,
        is_active: true,
      },
      create: {
        name: item.name,
        description: item.description,
      },
    });
  }

  console.log("Items seeded successfully");
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
