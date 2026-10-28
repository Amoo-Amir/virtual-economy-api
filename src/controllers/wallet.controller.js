const walletService = require("../services/wallet.service");

const getWalletInfo = async (req, res) => {
  const result = await walletService.getMyWallet(req.user.id);

  return res.status(200).json(result);
};

module.exports = {
  getWalletInfo,
};
