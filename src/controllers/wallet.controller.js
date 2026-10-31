const walletService = require("../services/wallet.service");

const getWalletInfo = async (req, res) => {
  const result = await walletService.getMyWallet(req.user.id);

  return res.status(200).json(result);
};

const resolveCard = async (req, res) => {
  const result = await walletService.resolveCard(
    req.body.cardNumber,
    req.user.id,
  );

  res.status(200).json(result);
};

const transfer = async (req, res) => {
  const result = await walletService.transfer(req.body, req.user.id);

  return res.status(200).json(result);
};

module.exports = {
  getWalletInfo,
  resolveCard,
  transfer,
};
