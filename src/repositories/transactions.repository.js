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

module.exports = { getMyTransactions };
