const prisma = require("../config/prisma");
const generateCardNumber = require("../utils/generateCardNumber");

const INITIAL_CREDIT = 200;

async function createWalletWithInitialCredit(tx, userId) {
  const wallet = await tx.wallets.create({
    data: {
      user_id: userId,
      asset_code: "USD",
      cardNumber: generateCardNumber(),
      balance: 0,
    },
  });

  const treasury = await tx.system_accounts.findUnique({
    where: {
      code: process.env.GAME_TREASURY_CODE,
    },
  });

  if (!treasury) {
    throw new Error("GAME_TREASURY account not found");
  }

  const transaction = await tx.transactions.create({
    data: {
      type: "INITIAL_CREDIT",
      entries: {
        create: [
          {
            system_account_id: treasury.id,
            entry_type: "DEBIT",
            amount: INITIAL_CREDIT,
          },
          {
            wallet_id: wallet.id,
            entry_type: "CREDIT",
            amount: INITIAL_CREDIT,
          },
        ],
      },
    },
  });

  // 4. Update wallet balance
  const updatedWallet = await tx.wallets.update({
    where: {
      id: wallet.id,
    },
    data: {
      balance: {
        increment: INITIAL_CREDIT,
      },
    },
  });

  return updatedWallet;
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

const createTransferTransaction = async (
  tx,
  senderId,
  senderWalletId,
  recipientWalletId,
  amount,
) => {
  return tx.transactions.create({
    data: {
      initiated_by_user_id: senderId,
      type: "TRANSFER",
      entries: {
        create: [
          {
            wallet_id: senderWalletId,
            entry_type: "DEBIT",
            amount,
          },
          {
            wallet_id: recipientWalletId,
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
  createWalletWithInitialCredit,
  getUserWalletById,
  MoneyTransfer,
  findSenderWallet,
  findRecipientWallet,
  deductBalance,
  addBalance,
  createTransferTransaction,
};
