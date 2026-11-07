jest.mock("../repositories/inventory.repository", () => ({
  getMyInventory: jest.fn(),
}));

const inventoryRepository = require("../repositories/inventory.repository");
const ApiError = require("../utils/ApiError");

const inventoryService = require("../services/inventory.service");

describe("Inventory Service Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should reject when user ID is missing", async () => {
    await expect(inventoryService.getMyInventory(null)).rejects.toBeInstanceOf(
      ApiError,
    );

    expect(inventoryRepository.getMyInventory).not.toHaveBeenCalled();
  });

  it("should return 404 when user inventory does not exist", async () => {
    inventoryRepository.getMyInventory.mockResolvedValue(null);

    await expect(
      inventoryService.getMyInventory("user-test-id"),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "user inventory not found.",
    });
  });

  it("should return user's inventory successfully", async () => {
    const inventory = [
      {
        id: "inventory-1",
        quantity: 5,
        item: {
          id: "item-1",
          name: "Iron Sword",
        },
      },
    ];

    inventoryRepository.getMyInventory.mockResolvedValue(inventory);

    const result = await inventoryService.getMyInventory("user-test-id");

    expect(result).toEqual(inventory);

    expect(inventoryRepository.getMyInventory).toHaveBeenCalledWith(
      "user-test-id",
    );
  });
});
