const inventoryService = require("../services/inventory.service");

const getMyInventory = async (req, res) => {
  const result = await inventoryService.getMyInventory(req.user.id);

  return res.status(200).json(result);
};

module.exports = {
  getMyInventory,
};
