const { pool } = require("../config/db");
const prisma = require("../config/prisma");

afterAll(async () => {
  await prisma.$disconnect();
  await pool.end();
});