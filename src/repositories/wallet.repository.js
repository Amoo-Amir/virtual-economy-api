const prisma = require("../config/prisma");

const INITIAL_CREDIT = 200;

async function createWalletWithInitialCredit(tx, userId) {
  const wallet = await tx.wallets.create({
    data: {
      user_id: userId,
      asset_code: "USD",
      balance: INITIAL_CREDIT,
    },
  });

  await tx.transactions.create({
    data: {
      wallet_id: wallet.id,
      type: "INITIAL_CREDIT",
      amount: INITIAL_CREDIT,
    },
  });

  return wallet;
}

const getUserWalletById = async (userId) => {
  return prisma.wallets.findMany({
    where: { user_id: userId },
    select: {
      id: true,
      asset_code: true,
      balance: true,
      created_at: true,
    },
  });
};


module.exports = {
  createWalletWithInitialCredit,
  getUserWalletById
};
