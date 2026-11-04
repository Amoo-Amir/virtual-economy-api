const request = require("supertest");
const { randomUUID } = require("crypto");
const app = require("../app");

const password = "TestPassword123";

const sender = {
  email: `sender-${randomUUID()}@example.com`,
  token: null,
  wallet: null,
};

const recipient = {
  email: `recipient-${randomUUID()}@example.com`,
  token: null,
  wallet: null,
};

const registerAndLogin = async (account) => {
  await request(app)
    .post("/api/auth/register")
    .send({
      email: account.email,
      password,
    })
    .expect(201);

  const loginResponse = await request(app)
    .post("/api/auth/login")
    .send({
      email: account.email,
      password,
    })
    .expect(200);

  account.token = loginResponse.body.token;

  const walletResponse = await request(app)
    .get("/api/wallet/myWallet")
    .set("Authorization", `Bearer ${account.token}`)
    .expect(200);

  account.wallet = walletResponse.body.wallets[0];
};

describe("Wallet API", () => {
  beforeAll(async () => {
    await registerAndLogin(sender);
    await registerAndLogin(recipient);
  });

  describe("GET /api/wallet/myWallet", () => {
    it("should return the authenticated user's wallet", async () => {
      const response = await request(app)
        .get("/api/wallet/myWallet")
        .set("Authorization", `Bearer ${sender.token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("ok");
      expect(response.body.wallets).toHaveLength(1);
      expect(response.body.wallets[0].id).toBe(sender.wallet.id);
      expect(response.body.wallets[0].asset_code).toBe("USD");
      expect(String(response.body.wallets[0].balance)).toBe("200");
    });

    it("should not return another user's wallet", async () => {
      const response = await request(app)
        .get("/api/wallet/myWallet")
        .set("Authorization", `Bearer ${sender.token}`);

      const walletIds = response.body.wallets.map((wallet) => wallet.id);

      expect(walletIds).not.toContain(recipient.wallet.id);
    });

    it("should reject requests without authentication", async () => {
      const response = await request(app).get("/api/wallet/myWallet");

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/wallet/resolve-card", () => {
    it("should resolve another user's card", async () => {
      const response = await request(app)
        .post("/api/wallet/resolve-card")
        .set("Authorization", `Bearer ${sender.token}`)
        .send({
          cardNumber: recipient.wallet.cardNumber,
        });

      expect(response.status).toBe(200);
      expect(response.body.recipient.name).toBe(recipient.email);
      expect(response.body.recipient.cardNumber).toBe(
        `********${recipient.wallet.cardNumber.slice(-4)}`,
      );
    });

    it("should reject resolving the user's own card", async () => {
      const response = await request(app)
        .post("/api/wallet/resolve-card")
        .set("Authorization", `Bearer ${sender.token}`)
        .send({
          cardNumber: sender.wallet.cardNumber,
        });

      expect(response.status).toBe(400);
    });

    it("should return 404 for an unknown card", async () => {
      const response = await request(app)
        .post("/api/wallet/resolve-card")
        .set("Authorization", `Bearer ${sender.token}`)
        .send({
          cardNumber: "999999999999",
        });

      expect(response.status).toBe(404);
    });

    it("should reject requests without authentication", async () => {
      const response = await request(app)
        .post("/api/wallet/resolve-card")
        .send({
          cardNumber: recipient.wallet.cardNumber,
        });

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/wallet/transfer", () => {
    it("should transfer money and update both wallet balances", async () => {
      const response = await request(app)
        .post("/api/wallet/transfer")
        .set("Authorization", `Bearer ${sender.token}`)
        .send({
          cardNumber: recipient.wallet.cardNumber,
          amount: "50",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe("50");
      expect(response.body.data.senderBalance).toBe("150");
      expect(response.body.data.transactionId).toBeDefined();

      const senderWalletResponse = await request(app)
        .get("/api/wallet/myWallet")
        .set("Authorization", `Bearer ${sender.token}`);

      const recipientWalletResponse = await request(app)
        .get("/api/wallet/myWallet")
        .set("Authorization", `Bearer ${recipient.token}`);

      expect(String(senderWalletResponse.body.wallets[0].balance)).toBe("150");
      expect(String(recipientWalletResponse.body.wallets[0].balance)).toBe(
        "250",
      );
    });

    it("should reject transfers with an invalid card number", async () => {
      const response = await request(app)
        .post("/api/wallet/transfer")
        .set("Authorization", `Bearer ${sender.token}`)
        .send({
          cardNumber: "12345",
          amount: "10",
        });

      expect(response.status).toBe(400);
    });

    it("should reject zero or negative transfer amounts", async () => {
      for (const amount of ["0", "-10"]) {
        const response = await request(app)
          .post("/api/wallet/transfer")
          .set("Authorization", `Bearer ${sender.token}`)
          .send({
            cardNumber: recipient.wallet.cardNumber,
            amount,
          });

        expect(response.status).toBe(400);
      }
    });

    it("should reject transfers with insufficient balance", async () => {
      const response = await request(app)
        .post("/api/wallet/transfer")
        .set("Authorization", `Bearer ${sender.token}`)
        .send({
          cardNumber: recipient.wallet.cardNumber,
          amount: "999999",
        });

      expect(response.status).toBe(400);
    });

    it("should reject transferring money to the user's own card", async () => {
      const response = await request(app)
        .post("/api/wallet/transfer")
        .set("Authorization", `Bearer ${sender.token}`)
        .send({
          cardNumber: sender.wallet.cardNumber,
          amount: "10",
        });

      expect(response.status).toBe(400);
    });

    it("should reject transfers to an unknown card", async () => {
      const response = await request(app)
        .post("/api/wallet/transfer")
        .set("Authorization", `Bearer ${sender.token}`)
        .send({
          cardNumber: "999999999999",
          amount: "10",
        });

      expect(response.status).toBe(404);
    });

    it("should reject requests without authentication", async () => {
      const response = await request(app)
        .post("/api/wallet/transfer")
        .send({
          cardNumber: recipient.wallet.cardNumber,
          amount: "10",
        });

      expect(response.status).toBe(401);
    });
  });
});