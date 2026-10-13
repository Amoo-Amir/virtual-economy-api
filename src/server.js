require("dotenv").config();

const app = require("./app");
const { connectDB, pool } = require("./config/db");

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start application:", error.message);

    await pool.end();

    process.exit(1);
  }
}

startServer();