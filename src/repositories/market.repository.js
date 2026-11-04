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

const getActiveListings = async ({ skip, take, where, orderBy }) => {
  const [listings, totalItems] = await prisma.$transaction([
    prisma.market_listings.findMany({
      where,
      skip,
      take,
      orderBy,
      select: {
        id: true,
        seller_id: true,
        item_id: true,
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
        seller: {
          select: {
            id: true,
          },
        },
      },
    }),

    prisma.market_listings.count({ where }),
  ]);

  return {
    listings,
    totalItems,
  };
};

const getActiveListingById = async (tx, listingId) => {
  return tx.market_listings.findFirst({
    where: {
      id: listingId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      seller_id: true,
      item_id: true,
      quantity: true,
      unit_price: true,
      status: true,
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

const claimListing = async (tx, listingId) => {
  return tx.market_listings.updateMany({
    where: {
      id: listingId,
      status: "ACTIVE",
    },
    data: {
      status: "SOLD",
    },
  });
};

const createMarketOrder = async (tx, data) => {
  return tx.market_orders.create({
    data: {
      listing_id: data.listingId,
      buyer_id: data.buyerId,
      seller_id: data.sellerId,
      transaction_id: data.transactionId,
      quantity: data.quantity,
      unit_price: data.unitPrice,
      total_price: data.totalPrice,
    },
    select: {
      id: true,
      listing_id: true,
      quantity: true,
      unit_price: true,
      total_price: true,
      created_at: true,
    },
  });
};
module.exports = {
  getUserInventory,
  createListing,
  getActiveListings,
  getActiveListingById,
  claimListing,
  createMarketOrder,
};
