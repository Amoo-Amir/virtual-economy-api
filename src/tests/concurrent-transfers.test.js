const request = require("supertest");
const { randomUUID } = require("crypto");
const app = require("../app");
const prisma = require("../config/prisma");

const password = "TestPassword123";

const createUser = async () => {
  const email = `concurrent-${randomUUID()}@example.com`;

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

describe("Concurrent Wallet Transfers", () => {
  let sender;
  let recipientOne;
  let recipientTwo;

  beforeAll(async () => {
    sender = await createUser();
    recipientOne = await createUser();
    recipientTwo = await createUser();
  });

  it("should allow only one transfer when two concurrent transfers exceed the sender's balance", async () => {
    const transfers = await Promise.all([
      request(app)
        .post("/api/wallet/transfer")
        .set("Authorization", `Bearer ${sender.token}`)
        .send({
          cardNumber: recipientOne.wallet.cardNumber,
          amount: "150",
        }),

      request(app)
        .post("/api/wallet/transfer")
        .set("Authorization", `Bearer ${sender.token}`)
        .send({
          cardNumber: recipientTwo.wallet.cardNumber,
          amount: "150",
        }),
    ]);

    const successfulTransfers = transfers.filter(
      (response) => response.status === 200,
    );

    const rejectedTransfers = transfers.filter(
      (response) => response.status === 400,
    );

    expect(successfulTransfers).toHaveLength(1);
    expect(rejectedTransfers).toHaveLength(1);

    const senderWallet = await prisma.wallets.findUnique({
      where: {
        id: sender.wallet.id,
      },
    });

    expect(senderWallet.balance.toString()).toBe("50");

    const recipientOneWallet = await prisma.wallets.findUnique({
      where: {
        id: recipientOne.wallet.id,
      },
    });

    const recipientTwoWallet = await prisma.wallets.findUnique({
      where: {
        id: recipientTwo.wallet.id,
      },
    });

    const recipientBalances = [
      recipientOneWallet.balance.toString(),
      recipientTwoWallet.balance.toString(),
    ];

    expect(
      recipientBalances.filter((balance) => balance === "350"),
    ).toHaveLength(1);

    expect(
      recipientBalances.filter((balance) => balance === "200"),
    ).toHaveLength(1);
  });

  it("should create only one transfer transaction and two ledger entries", async () => {
    const transactions = await prisma.transactions.findMany({
      where: {
        initiated_by_user_id: sender.id,
        type: "TRANSFER",
      },
      include: {
        entries: true,
      },
    });

    expect(transactions).toHaveLength(1);

    expect(transactions[0].entries).toHaveLength(2);

    expect(
      transactions[0].entries.filter((entry) => entry.entry_type === "DEBIT"),
    ).toHaveLength(1);

    expect(
      transactions[0].entries.filter((entry) => entry.entry_type === "CREDIT"),
    ).toHaveLength(1);
  });

  it("should never allow the sender's balance to become negative", async () => {
    const senderWallet = await prisma.wallets.findUnique({
      where: {
        id: sender.wallet.id,
      },
    });

    expect(senderWallet.balance.gte(0)).toBe(true);
  });
});
