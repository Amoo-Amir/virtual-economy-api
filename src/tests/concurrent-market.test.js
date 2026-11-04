const request = require("supertest");
const { randomUUID } = require("crypto");

const app = require("../app");
const prisma = require("../config/prisma");

const password = "TestPassword123";

describe("Concurrent Market Listings", () => {
  let seller;
  let item;

  beforeAll(async () => {
    const email = `concurrent-market-${randomUUID()}@example.com`;

    await request(app)
      .post("/api/auth/register")
      .send({ email, password })
      .expect(201);

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email, password })
      .expect(200);

    seller = {
      id: login.body.user.id,
      token: login.body.token,
    };

    item = await prisma.items.create({
      data: {
        name: `Concurrent Item ${randomUUID()}`,
        description: "Concurrent listing test item",
        is_active: true,
      },
    });

    await prisma.inventories.create({
      data: {
        user_id: seller.id,
        item_id: item.id,
        quantity: 5,
      },
    });
  });

  it("should allow only one listing when concurrent requests exceed available inventory", async () => {
    const results = await Promise.all([
      request(app)
        .post("/api/market/listings")
        .set("Authorization", `Bearer ${seller.token}`)
        .send({
          itemId: item.id,
          quantity: 4,
          unitPrice: "20",
        }),

      request(app)
        .post("/api/market/listings")
        .set("Authorization", `Bearer ${seller.token}`)
        .send({
          itemId: item.id,
          quantity: 4,
          unitPrice: "20",
        }),
    ]);

    const successful = results.filter((response) => response.status === 201);

    const rejected = results.filter((response) =>
      [400, 409].includes(response.status),
    );

    expect(successful).toHaveLength(1);
    expect(rejected).toHaveLength(1);
  });

  it("should preserve the correct remaining inventory", async () => {
    const inventory = await prisma.inventories.findUnique({
      where: {
        user_id_item_id: {
          user_id: seller.id,
          item_id: item.id,
        },
      },
    });

    expect(inventory.quantity).toBe(1);
  });

  it("should create exactly one active listing", async () => {
    const listings = await prisma.market_listings.findMany({
      where: {
        seller_id: seller.id,
        item_id: item.id,
        status: "ACTIVE",
      },
    });

    expect(listings).toHaveLength(1);
    expect(listings[0].quantity).toBe(4);
    expect(listings[0].unit_price.toString()).toBe("20");
  });
});
