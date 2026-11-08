require("dotenv").config();

const app = require("./app");
const prisma = require("./config/prisma");

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await prisma.$connect();

    console.log("PostgreSQL connection established");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start application:", error.message);

    await prisma.$disconnect();

    process.exit(1);
  }
}

startServer();
