const transactionRepo = require("../repositories/transactions.repository");
const walletRepo = require("../repositories/wallet.repository");
const ApiError = require("../utils/ApiError");

const getMyTransactions = async (userId, query) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;

  if (!Number.isInteger(page) || page < 1) {
    throw new ApiError(400, "Invalid page number");
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new ApiError(400, "Limit must be between 1 and 100");
  }

  const wallets = await walletRepo.getUserWalletById(userId);

  if (!wallets.length) {
    throw new ApiError(404, "Wallet not found");
  }

  const walletId = wallets[0].id;

  const result = await transactionRepo.getMyTransactions(
    walletId,
    page,
    limit
  );

  const totalPages = Math.ceil(result.totalItems / limit);

  return {
    success: true,
    data: {
      transactions: result.transactions,
      pagination: {
        currentPage: page,
        limit,
        totalItems: result.totalItems,
        totalPages,
      },
    },
  };
};

module.exports = {
  getMyTransactions,
};
