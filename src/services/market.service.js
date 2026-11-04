const { Prisma } = require("@prisma/client");
const prisma = require("../config/prisma");

const marketRepository = require("../repositories/market.repository");
const userRepository = require("../repositories/user.repository");
const walletRipository = require("../repositories/wallet.repository");
const inventoryRepository = require("../repositories/inventory.repository");
const transactionRepository = require("../repositories/transactions.repository");
const walletRepository = require("../repositories/wallet.repository");

const ApiError = require("../utils/ApiError");

const createListing = async (userId, data) => {
  const { itemId, quantity, unitPrice } = data;

  if (!itemId || typeof itemId !== "string") {
    throw new ApiError(400, "Invalid item ID");
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new ApiError(400, "Quantity must be a positive integer");
  }

  if (typeof unitPrice !== "string") {
    throw new ApiError(400, "Unit price must be a string");
  }

  let price;

  try {
    price = new Prisma.Decimal(unitPrice);
  } catch {
    throw new ApiError(400, "Invalid unit price");
  }

  if (!price.isFinite() || !price.gt(0)) {
    throw new ApiError(400, "Unit price must be greater than zero");
  }
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

const getListings = async (query) => {
  const {
    page = 1,
    limit = 10,
    search,
    itemId,
    minPrice,
    maxPrice,
    sortBy = "created_at",
    order = "desc",
  } = query;

  const currentPage = Number(page);
  const pageLimit = Number(limit);

  if (
    !Number.isInteger(currentPage) ||
    currentPage < 1 ||
    !Number.isInteger(pageLimit) ||
    pageLimit < 1 ||
    pageLimit > 50
  ) {
    throw new ApiError(400, "Invalid pagination parameters");
  }

  const allowedSortFields = ["created_at", "unit_price"];

  if (!allowedSortFields.includes(sortBy) || !["asc", "desc"].includes(order)) {
    throw new ApiError(400, "Invalid sorting parameters");
  }

  const where = {
    status: "ACTIVE",
  };

  if (search) {
    where.item = {
      name: {
        contains: search.trim(),
        mode: "insensitive",
      },
    };
  }

  if (itemId) {
    where.item_id = itemId;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.unit_price = {};

    try {
      if (minPrice !== undefined) {
        where.unit_price.gte = new Prisma.Decimal(minPrice);
      }

      if (maxPrice !== undefined) {
        where.unit_price.lte = new Prisma.Decimal(maxPrice);
      }
    } catch {
      throw new ApiError(400, "Invalid price filter");
    }

    if (
      where.unit_price.gte &&
      where.unit_price.lte &&
      where.unit_price.gte.gt(where.unit_price.lte)
    ) {
      throw new ApiError(400, "minPrice cannot be greater than maxPrice");
    }
  }

  const skip = (currentPage - 1) * pageLimit;

  const result = await marketRepository.getActiveListings({
    skip,
    take: pageLimit,
    where,
    orderBy: {
      [sortBy]: order,
    },
  });

  return {
    listings: result.listings.map((listing) => ({
      id: listing.id,
      item: listing.item,
      seller: {
        id: listing.seller.id,
      },
      quantity: listing.quantity,
      unitPrice: listing.unit_price.toString(),
      status: listing.status,
      createdAt: listing.created_at,
    })),

    pagination: {
      currentPage,
      limit: pageLimit,
      totalItems: result.totalItems,
      totalPages: Math.ceil(result.totalItems / pageLimit),
    },
  };
};

const purchaseListing = async (buyerId, listingId) => {
  try {
    return await prisma.$transaction(
      async (tx) => {
        const listing = await marketRepository.getActiveListingById(
          tx,
          listingId,
        );

        if (!listing) {
          throw new ApiError(404, "Listing not found");
        }

        if (listing.seller_id === buyerId) {
          throw new ApiError(400, "You cannot buy your own listing");
        }

        if (!listing.item.is_active) {
          throw new ApiError(409, "This item is no longer available");
        }

        const totalPrice = listing.unit_price.mul(listing.quantity);

        const claimed = await marketRepository.claimListing(tx, listingId);

        if (claimed.count !== 1) {
          throw new ApiError(409, "Listing is no longer available");
        }

        const buyerWallet = await walletRepository.findUserUsdWallet(
          tx,
          buyerId,
        );

        const sellerWallet = await walletRepository.findUserUsdWallet(
          tx,
          listing.seller_id,
        );

        if (!buyerWallet || !sellerWallet) {
          throw new ApiError(404, "Wallet not found");
        }

        const debit = await walletRepository.debitBalanceIfEnough(
          tx,
          buyerWallet.id,
          totalPrice,
        );

        if (debit.count !== 1) {
          throw new ApiError(400, "Insufficient balance");
        }

        await walletRepository.creditBalance(tx, sellerWallet.id, totalPrice);

        await inventoryRepository.addItemsToInventory(
          tx,
          buyerId,
          listing.item_id,
          listing.quantity,
        );

        const transaction =
          await transactionRepository.createMarketPurchaseTransaction(
            tx,
            buyerId,
            buyerWallet.id,
            sellerWallet.id,
            totalPrice,
          );

        const order = await marketRepository.createMarketOrder(tx, {
          listingId: listing.id,
          buyerId,
          sellerId: listing.seller_id,
          transactionId: transaction.id,
          quantity: listing.quantity,
          unitPrice: listing.unit_price,
          totalPrice,
        });

        return {
          listingId: listing.id,
          orderId: order.id,
          transactionId: transaction.id,
          item: {
            id: listing.item.id,
            name: listing.item.name,
            quantity: listing.quantity,
          },
          totalPrice: totalPrice.toString(),
          assetCode: buyerWallet.asset_code,
          status: "SOLD",
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  } catch (error) {
    if (error.code === "P2034") {
      throw new ApiError(409, "Purchase conflict. Please try again");
    }

    throw error;
  }
};

module.exports = {
  createListing,
  getListings,
  purchaseListing,
};
