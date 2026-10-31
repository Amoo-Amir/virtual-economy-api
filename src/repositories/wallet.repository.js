
const prisma = require("../config/prisma");
const generateCardNumber = require("../utils/generateCardNumber");

const INITIAL_CREDIT = 200;

async function createWalletWithInitialCredit(tx, userId) {
  const wallet = await tx.wallets.create({
    data: {
      user_id: userId,
      asset_code: "USD",
      cardNumber: generateCardNumber(),
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
      cardNumber: true,
    },
  });
};

const MoneyTransfer = async (cardNum) => {
  return prisma.wallets.findUnique({
    where: { cardNumber: cardNum },
    select: {
      cardNumber: true,
      users: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });
};


const findSenderWallet = async (tx, userId) => {
  return tx.wallets.findFirst({
    where: {
      user_id: userId,
      asset_code: "USD",
    },
  });
};


const findRecipientWallet = async (tx, cardNumber) => {
  return tx.wallets.findUnique({
    where: { cardNumber },
  });
};


const deductBalance = async (tx, walletId, amount) => {
  return tx.wallets.updateMany({
    where: {
      id: walletId,
      balance: { gte: amount },
    },
    data: {
      balance: { decrement: amount },
    },
  });
};


const addBalance = async (tx, walletId, amount) => {
  return tx.wallets.update({
    where: { id: walletId },
    data: {
      balance: { increment: amount },
    },
  });
};

const createTransaction = async (tx, walletId, type, amount) => {
  return tx.transactions.create({
    data: {
      wallet_id: walletId,
      type,
      amount,
    },
  });
};

module.exports = {
  createWalletWithInitialCredit,
  getUserWalletById,
  MoneyTransfer,
  findSenderWallet,
  findRecipientWallet,
  deductBalance,
  addBalance,
  createTransaction,
};
