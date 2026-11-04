const prisma = require("../config/prisma");

const getMyTransactions = async (walletId, page, limit) => {
  const skip = (page - 1) * limit;

  const where = {
    wallet_id: walletId,
  };

  const [entries, totalItems] = await prisma.$transaction([
    prisma.transaction_entries.findMany({
      where,
      select: {
        id: true,
        entry_type: true,
        amount: true,
        created_at: true,

        transaction: {
          select: {
            id: true,
            type: true,
            created_at: true,
          },
        },
      },
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      skip,
      take: limit,
    }),

    prisma.transaction_entries.count({
      where,
    }),
  ]);

  return {
    transactions: entries,
    totalItems,
  };
};

const createMarketPurchaseTransaction = async (
  tx,
  buyerId,
  buyerWalletId,
  sellerWalletId,
  amount,
) => {
  return tx.transactions.create({
    data: {
      initiated_by_user_id: buyerId,
      type: "MARKET_PURCHASE",
      entries: {
        create: [
          {
            wallet_id: buyerWalletId,
            entry_type: "DEBIT",
            amount,
          },
          {
            wallet_id: sellerWalletId,
            entry_type: "CREDIT",
            amount,
          },
        ],
      },
    },
    select: {
      id: true,
      type: true,
      created_at: true,
    },
  });
};

module.exports = {
  getMyTransactions,
  createMarketPurchaseTransaction,
};
