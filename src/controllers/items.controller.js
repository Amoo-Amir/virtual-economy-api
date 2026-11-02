const itemService = require("../services/items.service");

const getActiveItems = async (req, res) => {
  const result = await itemService.getActiveItems(req.query);

  res.status(200).json(result);
};

module.exports = {
  getActiveItems,
};
