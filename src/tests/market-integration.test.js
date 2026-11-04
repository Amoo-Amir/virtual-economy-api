const request = require("supertest");
const { randomUUID } = require("crypto");

const app = require("../app");
const prisma = require("../config/prisma");

const password = "TestPassword123";

describe("Market and Inventory Integration", () => {
  let seller;
  let item;

  beforeAll(async () => {
    const email = `market-integration-${randomUUID()}@example.com`;

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
        name: `Integration Item ${randomUUID()}`,
        description: "Market integration test item",
        is_active: true,
      },
    });

    await prisma.inventories.create({
      data: {
        user_id: seller.id,
        item_id: item.id,
        quantity: 10,
      },
    });
  });

  it("should reduce inventory after creating a market listing", async () => {
    const listingResponse = await request(app)
      .post("/api/market/listings")
      .set("Authorization", `Bearer ${seller.token}`)
      .send({
        itemId: item.id,
        quantity: 4,
        unitPrice: "30",
      })
      .expect(201);

    expect(listingResponse.body.listing.quantity).toBe(4);

    const inventoryResponse = await request(app)
      .get("/api/inventory/myINV")
      .set("Authorization", `Bearer ${seller.token}`)
      .expect(200);

    const inventoryItem = inventoryResponse.body.items.find(
      (entry) => entry.item.id === item.id,
    );

    expect(inventoryItem).toBeDefined();
    expect(inventoryItem.quantity).toBe(6);
  });

  it("should expose the created listing in the public market API", async () => {
    const response = await request(app)
      .get(`/api/market/listings?itemId=${item.id}`)
      .expect(200);

    expect(response.body.data.listings).toHaveLength(1);

    const listing = response.body.data.listings[0];

    expect(listing.item.id).toBe(item.id);
    expect(listing.seller.id).toBe(seller.id);
    expect(listing.quantity).toBe(4);
    expect(listing.unitPrice).toBe("30");
    expect(listing.status).toBe("ACTIVE");
  });

  it("should not change inventory when listing creation fails", async () => {
    await request(app)
      .post("/api/market/listings")
      .set("Authorization", `Bearer ${seller.token}`)
      .send({
        itemId: item.id,
        quantity: 100,
        unitPrice: "30",
      })
      .expect(400);

    const inventory = await prisma.inventories.findUnique({
      where: {
        user_id_item_id: {
          user_id: seller.id,
          item_id: item.id,
        },
      },
    });

    expect(inventory.quantity).toBe(6);

    const listings = await prisma.market_listings.findMany({
      where: {
        seller_id: seller.id,
        item_id: item.id,
      },
    });

    expect(listings).toHaveLength(1);
  });
});




