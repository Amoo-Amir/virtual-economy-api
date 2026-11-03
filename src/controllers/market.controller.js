const marketService = require("../services/market.service");

const createListing = async (req, res) => {
  const listing = await marketService.createListing(req.user.id, req.body);

  return res.status(201).json({
    status: "ok",
    listing: {
      id: listing.id,
      item: listing.item,
      quantity: listing.quantity,
      unitPrice: listing.unit_price.toString(),
      status: listing.status,
      createdAt: listing.created_at,
    },
  });
};

module.exports = {
  createListing,
};
