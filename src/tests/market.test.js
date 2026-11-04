const request = require("supertest");
const { randomUUID } = require("crypto");
const app = require("../app");
const prisma = require("../config/prisma");

const password = "TestPassword123";

describe("Market API", () => {
  let sellerToken;
  let sellerId;
  let item;
  let inactiveItem;
  let createdListingId;

  beforeAll(async () => {
    const email = `market-${randomUUID()}@example.com`;

    await request(app)
      .post("/api/auth/register")
      .send({ email, password })
      .expect(201);

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email, password })
      .expect(200);

    sellerToken = login.body.token;
    sellerId = login.body.user.id;

    item = await prisma.items.findUnique({
      where: { name: "Iron Sword" },
    });

    if (!item) {
      throw new Error("Iron Sword was not seeded in test database");
    }

    inactiveItem = await prisma.items.create({
      data: {
        name: `Inactive-${randomUUID()}`,
        description: "Inactive test item",
        is_active: false,
      },
    });

    await prisma.inventories.createMany({
      data: [
        {
          user_id: sellerId,
          item_id: item.id,
          quantity: 5,
        },
        {
          user_id: sellerId,
          item_id: inactiveItem.id,
          quantity: 5,
        },
      ],
    });
  });

  describe("POST /api/market/listings", () => {
    it("should create a listing successfully", async () => {
      const response = await request(app)
        .post("/api/market/listings")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({
          itemId: item.id,
          quantity: 3,
          unitPrice: "25",
        })
        .expect(201);

      expect(response.body.status).toBe("ok");
      expect(response.body.listing.id).toBeDefined();
      expect(response.body.listing.item.id).toBe(item.id);
      expect(response.body.listing.quantity).toBe(3);
      expect(response.body.listing.unitPrice).toBe("25");
      expect(response.body.listing.status).toBe("ACTIVE");

      createdListingId = response.body.listing.id;

      const inventory = await prisma.inventories.findUnique({
        where: {
          user_id_item_id: {
            user_id: sellerId,
            item_id: item.id,
          },
        },
      });

      expect(inventory.quantity).toBe(2);
    });

    it("should reject listing more items than available", async () => {
      const response = await request(app)
        .post("/api/market/listings")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({
          itemId: item.id,
          quantity: 3,
          unitPrice: "10",
        })
        .expect(400);

      expect(response.body.status).toBe("error");

      const inventory = await prisma.inventories.findUnique({
        where: {
          user_id_item_id: {
            user_id: sellerId,
            item_id: item.id,
          },
        },
      });

      expect(inventory.quantity).toBe(2);
    });

    it("should reject listing an inactive item", async () => {
      const response = await request(app)
        .post("/api/market/listings")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({
          itemId: inactiveItem.id,
          quantity: 1,
          unitPrice: "10",
        })
        .expect(400);

      expect(response.body.status).toBe("error");
    });

    it("should reject an invalid item ID", async () => {
      await request(app)
        .post("/api/market/listings")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({
          itemId: "invalid-id",
          quantity: 1,
          unitPrice: "10",
        })
        .expect(400);
    });

    it("should reject zero or negative quantity", async () => {
      for (const quantity of [0, -1]) {
        await request(app)
          .post("/api/market/listings")
          .set("Authorization", `Bearer ${sellerToken}`)
          .send({
            itemId: item.id,
            quantity,
            unitPrice: "10",
          })
          .expect(400);
      }
    });

    it("should reject an invalid unit price", async () => {
      for (const unitPrice of ["0", "-10", "abc"]) {
        await request(app)
          .post("/api/market/listings")
          .set("Authorization", `Bearer ${sellerToken}`)
          .send({
            itemId: item.id,
            quantity: 1,
            unitPrice,
          })
          .expect(400);
      }
    });

    it("should reject requests without authentication", async () => {
      await request(app)
        .post("/api/market/listings")
        .send({
          itemId: item.id,
          quantity: 1,
          unitPrice: "10",
        })
        .expect(401);
    });
  });

  describe("GET /api/market/listings", () => {
    it("should return active market listings", async () => {
      const response = await request(app)
        .get("/api/market/listings")
        .expect(200);

      expect(response.body.status).toBe("ok");
      expect(response.body.data.listings).toBeInstanceOf(Array);

      const listing = response.body.data.listings.find(
        (entry) => entry.id === createdListingId,
      );

      expect(listing).toBeDefined();
      expect(listing.status).toBe("ACTIVE");
      expect(listing.quantity).toBe(3);
      expect(listing.unitPrice).toBe("25");
    });

    it("should filter listings by item name", async () => {
      const response = await request(app)
        .get("/api/market/listings?search=Iron")
        .expect(200);

      expect(
        response.body.data.listings.some(
          (listing) => listing.id === createdListingId,
        ),
      ).toBe(true);
    });

    it("should filter listings by item ID", async () => {
      const response = await request(app)
        .get(`/api/market/listings?itemId=${item.id}`)
        .expect(200);

      expect(
        response.body.data.listings.every(
          (listing) => listing.item.id === item.id,
        ),
      ).toBe(true);
    });

    it("should filter listings by price range", async () => {
      const response = await request(app)
        .get("/api/market/listings?minPrice=20&maxPrice=30")
        .expect(200);

      expect(
        response.body.data.listings.some(
          (listing) => listing.id === createdListingId,
        ),
      ).toBe(true);
    });

    it("should reject an invalid price range", async () => {
      await request(app)
        .get("/api/market/listings?minPrice=50&maxPrice=10")
        .expect(400);
    });

    it("should reject invalid pagination parameters", async () => {
      await request(app).get("/api/market/listings?page=-1").expect(400);

      await request(app).get("/api/market/listings?limit=51").expect(400);
    });

    it("should reject invalid sorting parameters", async () => {
      await request(app).get("/api/market/listings?sortBy=name").expect(400);

      await request(app).get("/api/market/listings?order=random").expect(400);
    });

    it("should support sorting by unit price", async () => {
      const response = await request(app)
        .get("/api/market/listings?sortBy=unit_price&order=asc")
        .expect(200);

      const prices = response.body.data.listings.map((listing) =>
        Number(listing.unitPrice),
      );

      expect(prices).toEqual([...prices].sort((a, b) => a - b));
    });
  });
});
