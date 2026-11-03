const inventoryRepository = require("../repositories/inventory.repository");

const ApiError = require("../utils/ApiError");

const getMyInventory = async (userId) => {
  if (!userId) {
    throw new ApiError(404, "user id not found.");
  }

  const inventory = await inventoryRepository.getMyInventory(userId);

  if (!inventory) {
    throw new ApiError(404, "user inventory not found.");
  }

  return inventory;
};

module.exports = {
  getMyInventory,
};
