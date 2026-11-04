const request = require("supertest");
const { randomUUID } = require("crypto");
const app = require("../app");
const prisma = require("../config/prisma");

const password = "TestPassword123";

const createUser = async () => {
  const email = `inventory-${randomUUID()}@example.com`;

  await request(app)
    .post("/api/auth/register")
    .send({ email, password })
    .expect(201);

  const login = await request(app)
    .post("/api/auth/login")
    .send({ email, password })
    .expect(200);

  return {
    email,
    token: login.body.token,
    id: login.body.user.id,
  };
};

describe("Inventory API", () => {
  let owner;
  let anotherUser;
  let item;

  beforeAll(async () => {
    owner = await createUser();
    anotherUser = await createUser();

    item = await prisma.items.findUnique({
      where: { name: "Iron Sword" },
    });

    if (!item) {
      throw new Error("Iron Sword was not seeded in test database");
    }

    await prisma.inventories.createMany({
      data: [
        {
          user_id: owner.id,
          item_id: item.id,
          quantity: 5,
        },
        {
          user_id: anotherUser.id,
          item_id: item.id,
          quantity: 9,
        },
      ],
    });
  });

  describe("GET /api/inventory/myINV", () => {
    it("should return the authenticated user's inventory", async () => {
      const response = await request(app)
        .get("/api/inventory/myINV")
        .set("Authorization", `Bearer ${owner.token}`)
        .expect(200);

      expect(response.body.items).toBeInstanceOf(Array);
      expect(response.body.totalItems).toBe(1);
      expect(response.body.items[0].quantity).toBe(5);
      expect(response.body.items[0].item.name).toBe("Iron Sword");
    });

    it("should not return another user's inventory", async () => {
      const response = await request(app)
        .get("/api/inventory/myINV")
        .set("Authorization", `Bearer ${owner.token}`)
        .expect(200);

      const quantities = response.body.items.map(
        (inventory) => inventory.quantity,
      );

      expect(quantities).not.toContain(9);
    });

    it("should return an empty inventory for a new user", async () => {
      const newUser = await createUser();

      const response = await request(app)
        .get("/api/inventory/myINV")
        .set("Authorization", `Bearer ${newUser.token}`)
        .expect(200);

      expect(response.body.items).toEqual([]);
      expect(response.body.totalItems).toBe(0);
    });

    it("should reject requests without authentication", async () => {
      await request(app).get("/api/inventory/myINV").expect(401);
    });
  });
});
