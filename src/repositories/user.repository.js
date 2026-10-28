const prisma = require("../config/prisma");

async function createUser(tx, data) {
  return tx.users.create({
    data,
    select: {
      id: true,
      email: true,
      created_at: true,
    },
  });
}
async function findUserByEmail(email) {
  return prisma.users.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password_hash: true,
    },
  });
}

async function getUserById(userId) {
  return prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      password_hash: false,
      created_at: true,
    },
  });
}

async function myProfile(userId) {
  return prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      password_hash: false,
      created_at: true,
    },
  });
}

module.exports = {
  createUser,
  findUserByEmail,
  getUserById,
  myProfile,
};
