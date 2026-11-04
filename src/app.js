const express = require("express");
const { pool } = require("./config/db");
const authRouter = require("./routers/auth.route");
const walletRouter = require("./routers/wallet.route");
const transactionRouter = require("./routers/transaction.route");
const itemRouter = require("./routers/items.route");
const inventoryRouter = require("./routers/inventory.route");
const marketRouter = require("./routers/market.route");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const errorHandler = require("./middlewares/error.middleware");

const app = express();

app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/health", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        NOW() AS database_time,
        current_database() AS database_name
    `);

    res.status(200).json({
      status: "ok",
      database: "connected",
      ...result.rows[0],
    });
  } catch (error) {
    console.error("Database query failed:", error.message);

    res.status(500).json({
      status: "error",
      message: "Database connection failed",
    });
  }
});

app.use("/api", authRouter);
app.use("/api", walletRouter);
app.use("/api", transactionRouter);
app.use("/api", itemRouter);
app.use("/api", inventoryRouter);
app.use("/api", marketRouter);

app.use(errorHandler);

module.exports = app;
