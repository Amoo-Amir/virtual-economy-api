const request = require("supertest");
const app = require("../app");
const { pool } = require("../config/db");
const prisma = require("../config/prisma");

describe("GET /health", () => {


  it("should return 200 and confirm test database connection", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.database).toBe("connected");
    expect(response.body.database_name).toBe("wallet_test");
  });
});