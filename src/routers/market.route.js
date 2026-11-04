const express = require("express");
const marketController = require("../controllers/market.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const { createListingSchema } = require("../validations/market.validation");

const router = express.Router();

router.post(
  "/market/listings",
  authenticate,
  validate(createListingSchema),
  marketController.createListing,
);

router.get("/market/listings", marketController.getListings);

router.post(
  "/market/listings/:listingId/purchase",
  authenticate,
  marketController.purchaseListing,
);
module.exports = router;
// /api/market/listings/:listingId/purchase
