const { Prisma } = require("@prisma/client");
const prisma = require("../config/prisma");
const marketRepository = require("../repositories/market.repository");
const ApiError = require("../utils/ApiError");

const createListing = async (userId, data) => {
  const { itemId, quantity, unitPrice } = data;

  if (!itemId || typeof itemId !== "string") {
    throw new ApiError(400, "Invalid item ID");
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new ApiError(400, "Quantity must be a positive integer");
  }

  if (
    unitPrice === undefined ||
    unitPrice === null ||
    !Number.isFinite(Number(unitPrice)) ||
    Number(unitPrice) <= 0
  ) {
    throw new ApiError(400, "Unit price must be greater than zero");
  }

  const price = new Prisma.Decimal(String(unitPrice));

  return await prisma.$transaction(async (tx) => {
    const inventory = await marketRepository.getUserInventory(
      userId,
      itemId,
      tx,
    );

    if (!inventory || inventory.quantity < quantity) {
      throw new ApiError(400, "Insufficient item quantity");
    }

    if (!inventory.item.is_active) {
      throw new ApiError(400, "This item is not available for sale");
    }

    const updatedInventory = await tx.inventories.updateMany({
      where: {
        id: inventory.id,
        quantity: {
          gte: quantity,
        },
      },
      data: {
        quantity: {
          decrement: quantity,
        },
      },
    });

    if (updatedInventory.count !== 1) {
      throw new ApiError(409, "Inventory quantity changed. Please try again");
    }

    const listing = await marketRepository.createListing(
      {
        sellerId: userId,
        itemId,
        quantity,
        unitPrice: price,
      },
      tx,
    );

    return listing;
  });
};

module.exports = {
  createListing,
};
