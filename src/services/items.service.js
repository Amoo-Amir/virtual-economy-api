const itemRepository = require("../repositories/items.repository");
const ApiError = require("../utils/ApiError");

const getActiveItems = async (query) => {
  let { page = 1, limit = 10, search = "" } = query || {};

  page = Number(page);
  limit = Number(limit);

  if (
    !Number.isInteger(page) ||
    !Number.isInteger(limit) ||
    page < 1 ||
    limit < 1
  ) {
    throw new ApiError(400, "Invalid pagination parameters");
  }

  limit = Math.min(limit, 50);

  if (typeof search !== "string") {
    throw new ApiError(400, "Search must be a string");
  }

  search = search.trim();

  const { items, totalItems } = await itemRepository.getActiveItems(
    page,
    limit,
    search,
  );

  const totalPages = Math.ceil(totalItems / limit);

  return {
    items,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
    },
  };
};

module.exports = { getActiveItems };
