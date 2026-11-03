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

module.exports = { getMyInventory };