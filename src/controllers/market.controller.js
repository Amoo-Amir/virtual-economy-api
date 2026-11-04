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

const getListings = async (req, res, next) => {
  try {
    const result = await marketService.getListings(req.query);

    return res.status(200).json({
      status: "ok",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const purchaseListing = async (req, res) => {
  const result = await marketService.purchaseListing(
    req.user.id,
    req.params.listingId,
  );

  return res.status(200).json(result);
};

module.exports = {
  createListing,
  getListings,
  purchaseListing,
};
