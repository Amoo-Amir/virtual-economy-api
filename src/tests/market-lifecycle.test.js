const request = require("supertest");
const { randomUUID } = require("crypto");

const marketRepository = require("../repositories/market.repository");

const app = require("../app");
const prisma = require("../config/prisma");

const password = "TestPassword123";

describe("Market Lifecycle API", () => {
  let seller;
  let buyer;
  let secondBuyer;
  let item;

  const createAccount = async (prefix) => {
    const email = `${prefix}-${randomUUID()}@example.com`;

    await request(app)
      .post("/api/auth/register")
      .send({ email, password })
      .expect(201);

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email, password })
      .expect(200);

    return {
      id: response.body.user.id,
      token: response.body.token,
    };
  };

  const createListing = async ({ quantity = 2, unitPrice = "10" } = {}) => {
    const response = await request(app)
      .post("/api/market/listings")
      .set("Authorization", `Bearer ${seller.token}`)
      .send({
        itemId: item.id,
        quantity,
        unitPrice,
      })
      .expect(201);

    return response.body.listing.id;
  };

  const getWallet = (userId) => {
    return prisma.wallets.findUnique({
      where: {
        user_id_asset_code: {
          user_id: userId,
          asset_code: "USD",
        },
      },
    });
  };

  const getInventory = (userId) => {
    return prisma.inventories.findUnique({
      where: {
        user_id_item_id: {
          user_id: userId,
          item_id: item.id,
        },
      },
    });
  };

  beforeAll(async () => {
    seller = await createAccount("lifecycle-seller");
    buyer = await createAccount("lifecycle-buyer");
    secondBuyer = await createAccount("lifecycle-second-buyer");

    item = await prisma.items.create({
      data: {
        name: `Lifecycle Item ${randomUUID()}`,
        description: "Market lifecycle test item",
        is_active: true,
      },
    });
  });

  beforeEach(async () => {
    await prisma.wallets.update({
      where: {
        user_id_asset_code: {
          user_id: seller.id,
          asset_code: "USD",
        },
      },
      data: { balance: 200 },
    });

    await prisma.wallets.update({
      where: {
        user_id_asset_code: {
          user_id: buyer.id,
          asset_code: "USD",
        },
      },
      data: { balance: 200 },
    });

    await prisma.wallets.update({
      where: {
        user_id_asset_code: {
          user_id: secondBuyer.id,
          asset_code: "USD",
        },
      },
      data: { balance: 200 },
    });

    await prisma.inventories.upsert({
      where: {
        user_id_item_id: {
          user_id: seller.id,
          item_id: item.id,
        },
      },
      update: { quantity: 100 },
      create: {
        user_id: seller.id,
        item_id: item.id,
        quantity: 100,
      },
    });
  });

  describe("POST /api/market/listings/:listingId/purchase", () => {
    it("should purchase a listing and update wallets, inventory and ledger", async () => {
      const listingId = await createListing({
        quantity: 2,
        unitPrice: "15",
      });

      const response = await request(app)
        .post(`/api/market/listings/${listingId}/purchase`)
        .set("Authorization", `Bearer ${buyer.token}`)
        .expect(200);

      expect(response.body.status).toBe("SOLD");
      expect(response.body.listingId).toBe(listingId);
      expect(response.body.orderId).toBeDefined();
      expect(response.body.transactionId).toBeDefined();
      expect(response.body.totalPrice).toBe("30");
      expect(response.body.item.quantity).toBe(2);

      const [updatedListing, buyerWallet, sellerWallet] = await Promise.all([
        prisma.market_listings.findUnique({
          where: { id: listingId },
        }),
        getWallet(buyer.id),
        getWallet(seller.id),
      ]);

      expect(updatedListing.status).toBe("SOLD");
      expect(buyerWallet.balance.toString()).toBe("170");
      expect(sellerWallet.balance.toString()).toBe("230");

      const buyerInventory = await getInventory(buyer.id);

      expect(buyerInventory.quantity).toBe(2);

      const order = await prisma.market_orders.findUnique({
        where: { id: response.body.orderId },
      });

      expect(order).toBeDefined();
      expect(order.listing_id).toBe(listingId);
      expect(order.buyer_id).toBe(buyer.id);
      expect(order.seller_id).toBe(seller.id);
      expect(order.total_price.toString()).toBe("30");

      const entries = await prisma.transaction_entries.findMany({
        where: {
          transaction_id: response.body.transactionId,
        },
      });

      expect(entries).toHaveLength(2);

      expect(
        entries.some(
          (entry) =>
            entry.wallet_id === buyerWallet.id &&
            entry.entry_type === "DEBIT" &&
            entry.amount.toString() === "30",
        ),
      ).toBe(true);

      expect(
        entries.some(
          (entry) =>
            entry.wallet_id === sellerWallet.id &&
            entry.entry_type === "CREDIT" &&
            entry.amount.toString() === "30",
        ),
      ).toBe(true);
    });

    it("should reject purchasing your own listing", async () => {
      const listingId = await createListing();

      await request(app)
        .post(`/api/market/listings/${listingId}/purchase`)
        .set("Authorization", `Bearer ${seller.token}`)
        .expect(400);

      const listing = await prisma.market_listings.findUnique({
        where: { id: listingId },
      });

      expect(listing.status).toBe("ACTIVE");
    });

    it("should reject purchase when buyer has insufficient balance", async () => {
      const listingId = await createListing({
        quantity: 2,
        unitPrice: "50",
      });

      await prisma.wallets.update({
        where: {
          user_id_asset_code: {
            user_id: buyer.id,
            asset_code: "USD",
          },
        },
        data: { balance: 10 },
      });

      await request(app)
        .post(`/api/market/listings/${listingId}/purchase`)
        .set("Authorization", `Bearer ${buyer.token}`)
        .expect(400);

      const [listing, buyerWallet, sellerWallet, orderCount] =
        await Promise.all([
          prisma.market_listings.findUnique({
            where: { id: listingId },
          }),
          getWallet(buyer.id),
          getWallet(seller.id),
          prisma.market_orders.count({
            where: { listing_id: listingId },
          }),
        ]);

      expect(listing.status).toBe("ACTIVE");
      expect(buyerWallet.balance.toString()).toBe("10");
      expect(sellerWallet.balance.toString()).toBe("200");
      expect(orderCount).toBe(0);
    });

    it("should return 404 when listing does not exist", async () => {
      await request(app)
        .post(`/api/market/listings/${randomUUID()}/purchase`)
        .set("Authorization", `Bearer ${buyer.token}`)
        .expect(404);
    });

    it("should reject unauthenticated purchase requests", async () => {
      const listingId = await createListing();

      await request(app)
        .post(`/api/market/listings/${listingId}/purchase`)
        .expect(401);
    });

    it("should allow only one buyer to purchase a listing concurrently", async () => {
      const listingId = await createListing({
        quantity: 1,
        unitPrice: "25",
      });

      const responses = await Promise.all([
        request(app)
          .post(`/api/market/listings/${listingId}/purchase`)
          .set("Authorization", `Bearer ${buyer.token}`),

        request(app)
          .post(`/api/market/listings/${listingId}/purchase`)
          .set("Authorization", `Bearer ${secondBuyer.token}`),
      ]);

      const successful = responses.filter(
        (response) => response.status === 200,
      );

      const rejected = responses.filter((response) =>
        [404, 409].includes(response.status),
      );

      expect(successful).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      const [listing, orders] = await Promise.all([
        prisma.market_listings.findUnique({
          where: { id: listingId },
        }),
        prisma.market_orders.findMany({
          where: { listing_id: listingId },
        }),
      ]);

      expect(listing.status).toBe("SOLD");
      expect(orders).toHaveLength(1);
    });
  });

  describe("POST /api/market/listings/:listingId/cancel", () => {
    it("should cancel a listing and restore seller inventory", async () => {
      const listingId = await createListing({
        quantity: 4,
        unitPrice: "20",
      });

      const inventoryBeforeCancel = await getInventory(seller.id);
      const sellerWalletBefore = await getWallet(seller.id);

      expect(inventoryBeforeCancel.quantity).toBe(96);

      const response = await request(app)
        .post(`/api/market/listings/${listingId}/cancel`)
        .set("Authorization", `Bearer ${seller.token}`)
        .expect(200);

      expect(response.body.status).toBe("CANCELLED");
      expect(response.body.listingId).toBe(listingId);
      expect(response.body.returnedItem.quantity).toBe(4);

      const [listing, inventoryAfterCancel, sellerWalletAfter] =
        await Promise.all([
          prisma.market_listings.findUnique({
            where: { id: listingId },
          }),
          getInventory(seller.id),
          getWallet(seller.id),
        ]);

      expect(listing.status).toBe("CANCELLED");
      expect(inventoryAfterCancel.quantity).toBe(100);

      expect(sellerWalletAfter.balance.toString()).toBe(
        sellerWalletBefore.balance.toString(),
      );
    });

    it("should prevent another user from cancelling the listing", async () => {
      const listingId = await createListing();

      await request(app)
        .post(`/api/market/listings/${listingId}/cancel`)
        .set("Authorization", `Bearer ${buyer.token}`)
        .expect(403);

      const listing = await prisma.market_listings.findUnique({
        where: { id: listingId },
      });

      expect(listing.status).toBe("ACTIVE");

      const inventory = await getInventory(seller.id);
      expect(inventory.quantity).toBe(98);
    });

    it("should not restore inventory twice when cancelling twice", async () => {
      const listingId = await createListing({
        quantity: 3,
      });

      await request(app)
        .post(`/api/market/listings/${listingId}/cancel`)
        .set("Authorization", `Bearer ${seller.token}`)
        .expect(200);

      const secondResponse = await request(app)
        .post(`/api/market/listings/${listingId}/cancel`)
        .set("Authorization", `Bearer ${seller.token}`);

      expect([404, 409]).toContain(secondResponse.status);

      const inventory = await getInventory(seller.id);

      expect(inventory.quantity).toBe(100);
    });

    it("should reject unauthenticated cancellation requests", async () => {
      const listingId = await createListing();

      await request(app)
        .post(`/api/market/listings/${listingId}/cancel`)
        .expect(401);
    });
  });

  describe("GET /api/market/my-listings", () => {
    it("should return only listings created by the authenticated seller", async () => {
      const listingId = await createListing();

      const response = await request(app)
        .get("/api/market/my-listings")
        .set("Authorization", `Bearer ${seller.token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: listingId,
            status: "ACTIVE",
          }),
        ]),
      );
    });

    it("should filter listings by status", async () => {
      const activeListingId = await createListing();
      const cancelledListingId = await createListing();

      await request(app)
        .post(`/api/market/listings/${cancelledListingId}/cancel`)
        .set("Authorization", `Bearer ${seller.token}`)
        .expect(200);

      const activeResponse = await request(app)
        .get("/api/market/my-listings?status=ACTIVE")
        .set("Authorization", `Bearer ${seller.token}`)
        .expect(200);

      expect(
        activeResponse.body.data.some(
          (listing) => listing.id === activeListingId,
        ),
      ).toBe(true);

      expect(
        activeResponse.body.data.some(
          (listing) => listing.id === cancelledListingId,
        ),
      ).toBe(false);

      const cancelledResponse = await request(app)
        .get("/api/market/my-listings?status=CANCELLED")
        .set("Authorization", `Bearer ${seller.token}`)
        .expect(200);

      expect(
        cancelledResponse.body.data.some(
          (listing) => listing.id === cancelledListingId,
        ),
      ).toBe(true);
    });

    it("should reject invalid status and pagination", async () => {
      await request(app)
        .get("/api/market/my-listings?status=INVALID")
        .set("Authorization", `Bearer ${seller.token}`)
        .expect(400);

      await request(app)
        .get("/api/market/my-listings?page=0")
        .set("Authorization", `Bearer ${seller.token}`)
        .expect(400);

      await request(app)
        .get("/api/market/my-listings?limit=101")
        .set("Authorization", `Bearer ${seller.token}`)
        .expect(400);
    });

    it("should reject requests without authentication", async () => {
      await request(app).get("/api/market/my-listings").expect(401);
    });
  });

  describe("GET /api/market/my-orders and /api/market/my-sales", () => {
    it("should show the purchase in buyer history and sale in seller history", async () => {
      const listingId = await createListing({
        quantity: 2,
        unitPrice: "12",
      });

      await request(app)
        .post(`/api/market/listings/${listingId}/purchase`)
        .set("Authorization", `Bearer ${buyer.token}`)
        .expect(200);

      const buyerOrders = await request(app)
        .get("/api/market/my-orders")
        .set("Authorization", `Bearer ${buyer.token}`)
        .expect(200);

      expect(buyerOrders.body.success).toBe(true);
      expect(
        buyerOrders.body.data.some(
          (order) =>
            order.listingId === listingId &&
            order.quantity === 2 &&
            order.totalPrice === "24",
        ),
      ).toBe(true);

      const sellerSales = await request(app)
        .get("/api/market/my-sales")
        .set("Authorization", `Bearer ${seller.token}`)
        .expect(200);

      expect(sellerSales.body.success).toBe(true);
      expect(
        sellerSales.body.data.some(
          (sale) =>
            sale.listingId === listingId &&
            sale.quantity === 2 &&
            sale.totalPrice === "24",
        ),
      ).toBe(true);

      const buyerSales = await request(app)
        .get("/api/market/my-sales")
        .set("Authorization", `Bearer ${buyer.token}`)
        .expect(200);

      expect(
        buyerSales.body.data.some((sale) => sale.listingId === listingId),
      ).toBe(false);

      const sellerOrders = await request(app)
        .get("/api/market/my-orders")
        .set("Authorization", `Bearer ${seller.token}`)
        .expect(200);

      expect(
        sellerOrders.body.data.some((order) => order.listingId === listingId),
      ).toBe(false);
    });

    it("should reject invalid history pagination", async () => {
      await request(app)
        .get("/api/market/my-orders?page=-1")
        .set("Authorization", `Bearer ${buyer.token}`)
        .expect(400);

      await request(app)
        .get("/api/market/my-sales?limit=101")
        .set("Authorization", `Bearer ${seller.token}`)
        .expect(400);
    });

    it("should reject unauthenticated history requests", async () => {
      await request(app).get("/api/market/my-orders").expect(401);
      await request(app).get("/api/market/my-sales").expect(401);
    });
  });
  it("should rollback all purchase changes when market order creation fails", async () => {
    const listingId = await createListing({
      quantity: 2,
      unitPrice: "10",
    });

    const [
      listingBefore,
      buyerWalletBefore,
      sellerWalletBefore,
      buyerInventoryBefore,
      transactionCountBefore,
      orderCountBefore,
    ] = await Promise.all([
      prisma.market_listings.findUnique({ where: { id: listingId } }),
      getWallet(buyer.id),
      getWallet(seller.id),
      getInventory(buyer.id),
      prisma.transactions.count(),
      prisma.market_orders.count(),
    ]);

    const spy = jest
      .spyOn(marketRepository, "createMarketOrder")
      .mockRejectedValue(new Error("Forced market order failure"));

    try {
      await request(app)
        .post(`/api/market/listings/${listingId}/purchase`)
        .set("Authorization", `Bearer ${buyer.token}`)
        .expect(500);
    } finally {
      spy.mockRestore();
    }

    const [
      listingAfter,
      buyerWalletAfter,
      sellerWalletAfter,
      buyerInventoryAfter,
      transactionCountAfter,
      orderCountAfter,
    ] = await Promise.all([
      prisma.market_listings.findUnique({ where: { id: listingId } }),
      getWallet(buyer.id),
      getWallet(seller.id),
      getInventory(buyer.id),
      prisma.transactions.count(),
      prisma.market_orders.count(),
    ]);

    expect(listingAfter.status).toBe(listingBefore.status);

    expect(buyerWalletAfter.balance.equals(buyerWalletBefore.balance)).toBe(
      true,
    );
    expect(sellerWalletAfter.balance.equals(sellerWalletBefore.balance)).toBe(
      true,
    );

    expect(buyerInventoryAfter.quantity).toBe(buyerInventoryBefore.quantity);

    expect(transactionCountAfter).toBe(transactionCountBefore);
    expect(orderCountAfter).toBe(orderCountBefore);
  });
});
