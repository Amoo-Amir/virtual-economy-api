const express = require("express");
const marketController = require("../controllers/market.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/market/listings", authenticate, marketController.createListing);

module.exports = router;
