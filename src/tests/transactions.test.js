const request = require("supertest");
const { randomUUID } = require("crypto");
const app = require("../app");

const email = `transactions-${randomUUID()}@example.com`;
const password = "TestPassword123";

let token;

describe("Transactions API", () => {
  beforeAll(async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email, password })
      .expect(201);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email, password })
      .expect(200);

    token = loginResponse.body.token;
  });

  describe("GET /api/transactions", () => {
    it("should return the user's transaction history", async () => {
      const response = await request(app)
        .get("/api/transactions")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toBeInstanceOf(Array);
      expect(response.body.data.transactions.length).toBeGreaterThan(0);

      const initialCredit = response.body.data.transactions.find(
        (entry) => entry.transaction.type === "INITIAL_CREDIT",
      );

      expect(initialCredit).toBeDefined();
      expect(initialCredit.entry_type).toBe("CREDIT");
      expect(String(initialCredit.amount)).toBe("200");
    });

    it("should return pagination information", async () => {
      const response = await request(app)
        .get("/api/transactions?page=1&limit=5")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.pagination).toEqual({
        currentPage: 1,
        limit: 5,
        totalItems: expect.any(Number),
        totalPages: expect.any(Number),
      });
    });

    it("should reject an invalid page number", async () => {
      const response = await request(app)
        .get("/api/transactions?page=-1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
    });

    it("should reject a limit greater than 100", async () => {
      const response = await request(app)
        .get("/api/transactions?limit=101")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
    });

    it("should reject requests without authentication", async () => {
      const response = await request(app).get("/api/transactions");

      expect(response.status).toBe(401);
    });
  });
});