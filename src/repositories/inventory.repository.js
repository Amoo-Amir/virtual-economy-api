const prisma = require("../config/prisma");

const getMyInventory = async (userId) => {
  const where = {
    user_id: userId,
    quantity: {
      gt: 0,
    },
  };

  const [items, totalItems] = await prisma.$transaction([
    prisma.inventories.findMany({
      where,
      select: {
        id: true,
        quantity: true,
        item: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: {
        item: {
          name: "asc",
        },
      },
    }),

    prisma.inventories.count({
      where,
    }),
  ]);

  return {
    items,
    totalItems,
  };
};

const addItemsToInventory = async (tx, userId, itemId, quantity) => {
  return tx.inventories.upsert({
    where: {
      user_id_item_id: {
        user_id: userId,
        item_id: itemId,
      },
    },
    create: {
      user_id: userId,
      item_id: itemId,
      quantity,
    },
    update: {
      quantity: {
        increment: quantity,
      },
    },
  });
};

module.exports = {
  getMyInventory,
  addItemsToInventory,
};
