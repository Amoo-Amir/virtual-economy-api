const prisma = require("../config/prisma");

const getUserInventory = async (userId, itemId, tx = prisma) => {
  return await tx.inventories.findUnique({
    where: {
      user_id_item_id: {
        user_id: userId,
        item_id: itemId,
      },
    },
    select: {
      id: true,
      quantity: true,
      item: {
        select: {
          id: true,
          name: true,
          is_active: true,
        },
      },
    },
  });
};

const createListing = async (data, tx = prisma) => {
  return await tx.market_listings.create({
    data: {
      seller_id: data.sellerId,
      item_id: data.itemId,
      quantity: data.quantity,
      unit_price: data.unitPrice,
    },
    select: {
      id: true,
      quantity: true,
      unit_price: true,
      status: true,
      created_at: true,
      item: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  });
};

module.exports = {
  getUserInventory,
  createListing,
};
