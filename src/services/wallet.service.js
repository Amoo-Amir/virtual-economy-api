
const prisma = require("../config/prisma");
const { Prisma } = require("@prisma/client");

const walletRepository = require("../repositories/wallet.repository");
const ApiError = require("../utils/ApiError");

const getMyWallet = async (userId) => {
  const wallets = await walletRepository.getUserWalletById(userId);

  return {
    status: "ok",
    wallets,
  };
};

const resolveCard = async (cardNum, currentUserId) => {
  const wallet = await walletRepository.MoneyTransfer(cardNum);

  if (!wallet) {
    throw new ApiError(404, "Recipient wallet not found");
  }

  if (wallet.users.id === currentUserId) {
    throw new ApiError(400, "You cannot transfer money to yourself");
  }

  const maskedCardNumber = `********${wallet.cardNumber.slice(-4)}`;

  return {
    recipient: {
      name: wallet.users.email,
      cardNumber: maskedCardNumber,
    },
  };
};

const transfer = async (data, currentUserId) => {
  const { cardNumber, amount } = data || {};

 
  if (
    typeof cardNumber !== "string" ||
    !/^\d{12}$/.test(cardNumber)
  ) {
    throw new ApiError(400, "Invalid card number");
  }

  if (
    typeof amount !== "string" ||
    !/^(?:0|[1-9]\d{0,17})(?:\.\d{1,18})?$/.test(amount)
  ) {
    throw new ApiError(400, "Invalid amount");
  }

  const transferAmount = new Prisma.Decimal(amount);

  if (transferAmount.lte(0)) {
    throw new ApiError(400, "Amount must be greater than zero");
  }

  const result = await prisma.$transaction(async (tx) => {
    const sender = await walletRepository.findSenderWallet(
      tx,
      currentUserId,
    );

    if (!sender) {
      throw new ApiError(404, "Sender wallet not found");
    }

    if (sender.balance > amount){
      throw new ApiError(400,"Your account balance is insufficient.");
      
    }

    const recipient = await walletRepository.findRecipientWallet(
      tx,
      cardNumber,
    );

    if (!recipient) {
      throw new ApiError(404, "Recipient wallet not found");
    }

    if (sender.id === recipient.id) {
      throw new ApiError(400, "You cannot transfer money to yourself");
    }

    if (sender.asset_code !== recipient.asset_code) {
      throw new ApiError(400, "Wallet currencies do not match");
    }

    const deduction = await walletRepository.deductBalance(
      tx,
      sender.id,
      transferAmount,
    );

    if (deduction.count !== 1) {
      throw new ApiError(400, "Insufficient balance");
    }

    const updatedRecipient = await walletRepository.addBalance(
      tx,
      recipient.id,
      transferAmount,
    );

    const senderTransaction =
      await walletRepository.createTransaction(
        tx,
        sender.id,
        "TRANSFER_OUT",
        transferAmount,
      );

    const recipientTransaction =
      await walletRepository.createTransaction(
        tx,
        recipient.id,
        "TRANSFER_IN",
        transferAmount,
      );

    const updatedSender = await tx.wallets.findUnique({
      where: {
        id: sender.id,
      },
      select: {
        balance: true,
      },
    });

    return {
      amount: transferAmount.toString(),
      assetCode: sender.asset_code,
      senderBalance: updatedSender.balance.toString(),
      recipientBalance: updatedRecipient.balance.toString(),
      transactions: {
        outgoing: senderTransaction.id,
        incoming: recipientTransaction.id,
      },
    };
  });

  return {
    success: true,
    message: "Transfer completed successfully",
    data: result,
  };
};

module.exports = {
  getMyWallet,
  resolveCard,
  transfer,
};
