const express = require("express");
const inventoryController = require("../controllers/inventory.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get(
  "/inventory/myINV",
  authenticate,
  inventoryController.getMyInventory,
);

module.exports = router;
