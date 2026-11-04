const request = require("supertest");
const { randomUUID } = require("crypto");
const app = require("../app");

const password = "TestPassword123";

describe("Items API", () => {
  let token;

  beforeAll(async () => {
    const email = `items-${randomUUID()}@example.com`;

    await request(app)
      .post("/api/auth/register")
      .send({ email, password })
      .expect(201);

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email, password })
      .expect(200);

    token = login.body.token;
  });

  describe("GET /api/items", () => {
    it("should return active items", async () => {
      const response = await request(app)
        .get("/api/items")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.items).toBeInstanceOf(Array);
      expect(response.body.items.length).toBeGreaterThan(0);

      for (const item of response.body.items) {
        expect(item).toHaveProperty("id");
        expect(item).toHaveProperty("name");
      }
    });

    it("should support pagination", async () => {
      const response = await request(app)
        .get("/api/items?page=1&limit=2")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.items.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 2,
        totalItems: expect.any(Number),
        totalPages: expect.any(Number),
      });
    });

    it("should search items by name", async () => {
      const response = await request(app)
        .get("/api/items?search=Iron")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.items.length).toBeGreaterThan(0);

      for (const item of response.body.items) {
        expect(item.name.toLowerCase()).toContain("iron");
      }
    });

    it("should return an empty array when no item matches", async () => {
      const response = await request(app)
        .get("/api/items?search=nonexistent-item-123")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.items).toEqual([]);
      expect(response.body.pagination.totalItems).toBe(0);
      expect(response.body.pagination.totalPages).toBe(0);
    });

    it("should reject an invalid page number", async () => {
      await request(app)
        .get("/api/items?page=-1")
        .set("Authorization", `Bearer ${token}`)
        .expect(400);
    });

    it("should reject an invalid limit", async () => {
      await request(app)
        .get("/api/items?limit=0")
        .set("Authorization", `Bearer ${token}`)
        .expect(400);
    });

    it("should cap the maximum limit at 50", async () => {
      const response = await request(app)
        .get("/api/items?limit=100")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.pagination.limit).toBe(50);
    });

    it("should reject requests without authentication", async () => {
      await request(app).get("/api/items").expect(401);
    });
  });
});
