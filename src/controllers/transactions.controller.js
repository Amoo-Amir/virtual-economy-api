const transactionService = require("../services/transaction.service");

const getMyTransactions = async (req, res) => {
  const result = await transactionService.getMyTransactions(
    req.user.id,
    req.query,
  );

  res.status(200).json(result);
};

module.exports = {
  getMyTransactions,
};
