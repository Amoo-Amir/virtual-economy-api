const express = require("express");
const { pool } = require("./config/db");
const authRouter = require("./routers/auth.ruote");

const app = express();

app.use(express.json());

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



module.exports = app;
