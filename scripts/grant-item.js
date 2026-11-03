require("dotenv").config();

const prisma = require("../src/config/prisma");

const grantItem = async () => {
  try {
    // Change this to the target user's email
    const userEmail = "amirmahdi2@gmail.com";

    // Item to add to the user's inventory
    const itemName = "Golden Shield";

    // Quantity to assign
    const quantity = 5;

    // Find user
    const user = await prisma.users.findUnique({
      where: {
        email: userEmail,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Find item
    const item = await prisma.items.findUnique({
      where: {
        name: itemName,
      },
    });

    if (!item) {
      throw new Error("Item not found");
    }

    // Create or update inventory
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