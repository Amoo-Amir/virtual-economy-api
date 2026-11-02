const express = require("express");
const itemsController = require("../controllers/items.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/items", authenticate, itemsController.getActiveItems);

module.exports = router;
