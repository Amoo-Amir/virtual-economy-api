const prisma = require("../src/config/prisma");

async function main() {
  try {
    const user = await prisma.users.count();

    console.log("Database connection successful!");
    console.log("Total users:", user);
  } catch (error) {
    console.error("Prisma test failed:", error.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
