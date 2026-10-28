
const walletRepository = require("../repositories/wallet.repository");

const getMyWallet = async (userId) => {
  const wallets = await walletRepository.getUserWalletById(userId);

  return {
    status: "ok",
    wallets,
  };
};

module.exports = {
  getMyWallet,
};
