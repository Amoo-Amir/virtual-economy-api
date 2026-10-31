
const prisma = require("../config/prisma");

const getMyTransactions = async (walletId, page, limit) => {
  const skip = (page - 1) * limit;

  const [transactions, totalItems] = await prisma.$transaction([
    prisma.transactions.findMany({
      where: {
        wallet_id: walletId,
      },
      select: {
        id: true,
        amount: true,
        type: true,
        created_at: true,
      },
      orderBy: [
        { created_at: "desc" },
        { id: "desc" },
      ],
      skip,
      take: limit,
    }),

    prisma.transactions.count({
      where: {
        wallet_id: walletId,
      },
    }),
  ]);

  return { transactions, totalItems };
};

module.exports = { getMyTransactions };
