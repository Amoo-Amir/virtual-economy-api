require("dotenv").config();

const prisma = require("../src/config/prisma");

const grantItem = async () => {
  try {
    const userEmail = "amirmahdi12@gmail.com";

    const itemName = "Golden Shield";

    const quantity = 5;

    const user = await prisma.users.findUnique({
      where: {
        email: userEmail,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const item = await prisma.items.findUnique({
      where: {
        name: itemName,
      },
    });

    if (!item) {
      throw new Error("Item not found");
    }

    const inventory = await prisma.inventories.upsert({
      where: {
        user_id_item_id: {
          user_id: user.id,
          item_id: item.id,
        },
      },
      update: {
        quantity,
      },
      create: {
        user_id: user.id,
        item_id: item.id,
        quantity,
      },
      select: {
        id: true,
        quantity: true,
        item: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log("Inventory updated successfully:");
    console.log(inventory);
  } catch (error) {
    console.error("Failed to grant item:", error.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
};

grantItem();
