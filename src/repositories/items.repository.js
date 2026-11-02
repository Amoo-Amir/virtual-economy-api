const prisma = require("../config/prisma");

const getActiveItems = async (page, limit, search) => {
  const skip = (page - 1) * limit;

  const where = {
    is_active: true,
    ...(search && {
      name: {
        contains: search,
        mode: "insensitive",
      },
    }),
  };

  const [items, totalItems] = await prisma.$transaction([
    prisma.items.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        created_at: true,
      },
      orderBy: {
        name: "asc",
      },
      skip,
      take: limit,
    }),

    prisma.items.count({ where }),
  ]);

  return { items, totalItems };
};

module.exports = { getActiveItems };
