const request = require("supertest");
const { randomUUID } = require("crypto");
const { Prisma } = require("@prisma/client");

const app = require("../app");
const prisma = require("../config/prisma");

const password = "TestPassword123";

const createUser = async () => {
  const email = `ledger-${randomUUID()}@example.com`;

  await request(app)
    .post("/api/auth/register")
    .send({ email, password })
    .expect(201);

  const login = await request(app)
    .post("/api/auth/login")
    .send({ email, password })
    .expect(200);

  const walletResponse = await request(app)
    .get("/api/wallet/myWallet")
    .set("Authorization", `Bearer ${login.body.token}`)
    .expect(200);

  return {
    id: login.body.user.id,
    token: login.body.token,
    wallet: walletResponse.body.wallets[0],
  };
};

describe("Ledger Integrity", () => {
  let sender;
  let recipient;
  let transferTransactionId;

  beforeAll(async () => {
    sender = await createUser();
    recipient = await createUser();

    const transferResponse = await request(app)
      .post("/api/wallet/transfer")
      .set("Authorization", `Bearer ${sender.token}`)
      .send({
        cardNumber: recipient.wallet.cardNumber,
        amount: "50",
      })
      .expect(200);

    transferTransactionId = transferResponse.body.data.transactionId;
  });

  it("should create balanced entries for every transaction", async () => {
    const transactions = await prisma.transactions.findMany({
      where: {
        id: {
          in: [transferTransactionId],
        },
      },
      include: {
        entries: true,
      },
    });

    expect(transactions).toHaveLength(1);

    for (const transaction of transactions) {
      const debits = transaction.entries.filter(
        (entry) => entry.entry_type === "DEBIT",
      );

      const credits = transaction.entries.filter(
        (entry) => entry.entry_type === "CREDIT",
      );

      expect(debits.length).toBe(1);
      expect(credits.length).toBe(1);

      const totalDebit = debits.reduce(
        (sum, entry) => sum.plus(entry.amount),
        new Prisma.Decimal(0),
      );

      const totalCredit = credits.reduce(
        (sum, entry) => sum.plus(entry.amount),
        new Prisma.Decimal(0),
      );

      expect(totalDebit.equals(totalCredit)).toBe(true);
    }
  });

  it("should create exactly one debit and one credit for a transfer", async () => {
    const entries = await prisma.transaction_entries.findMany({
      where: {
        transaction_id: transferTransactionId,
      },
    });

    expect(entries).toHaveLength(2);

    const debit = entries.find((entry) => entry.entry_type === "DEBIT");

    const credit = entries.find((entry) => entry.entry_type === "CREDIT");

    expect(debit).toBeDefined();
    expect(credit).toBeDefined();

    expect(debit.wallet_id).toBe(sender.wallet.id);
    expect(credit.wallet_id).toBe(recipient.wallet.id);

    expect(debit.amount.toString()).toBe("50");
    expect(credit.amount.toString()).toBe("50");
  });

  it("should keep wallet balances consistent with their ledger entries", async () => {
    for (const account of [sender, recipient]) {
      const wallet = await prisma.wallets.findUnique({
        where: {
          id: account.wallet.id,
        },
      });

      const entries = await prisma.transaction_entries.findMany({
        where: {
          wallet_id: wallet.id,
        },
      });

      const ledgerBalance = entries.reduce((balance, entry) => {
        if (entry.entry_type === "CREDIT") {
          return balance.plus(entry.amount);
        }

        return balance.minus(entry.amount);
      }, new Prisma.Decimal(0));

      expect(ledgerBalance.equals(wallet.balance)).toBe(true);
    }
  });

  it("should record the initial credit as a balanced transaction", async () => {
    for (const account of [sender, recipient]) {
      const initialCredit = await prisma.transactions.findFirst({
        where: {
          type: "INITIAL_CREDIT",
          entries: {
            some: {
              wallet_id: account.wallet.id,
              entry_type: "CREDIT",
            },
          },
        },
        include: {
          entries: true,
        },
      });

      expect(initialCredit).not.toBeNull();
      expect(initialCredit.entries).toHaveLength(2);

      const debit = initialCredit.entries.find(
        (entry) => entry.entry_type === "DEBIT",
      );

      const credit = initialCredit.entries.find(
        (entry) => entry.entry_type === "CREDIT",
      );

      expect(debit).toBeDefined();
      expect(credit).toBeDefined();

      expect(debit.system_account_id).not.toBeNull();
      expect(debit.wallet_id).toBeNull();

      expect(credit.wallet_id).toBe(account.wallet.id);
      expect(credit.system_account_id).toBeNull();

      expect(debit.amount.equals(credit.amount)).toBe(true);
      expect(credit.amount.toString()).toBe("200");
    }
  });
});
