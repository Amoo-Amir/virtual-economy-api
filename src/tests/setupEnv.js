const path = require("path");
const dotenv = require("dotenv");

const envPath = path.resolve(__dirname, "../../.env.test");

const result = dotenv.config({
  path: envPath,
  override: true,
  quiet: true,
});
if (result.error) {
  throw new Error("Failed to load .env.test");
}

process.env.NODE_ENV = "test";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing in .env.test");
}

const database = new URL(databaseUrl).pathname.slice(1);

if (database !== "wallet_test") {
  throw new Error(
    `Unsafe test database: ${database}. Expected wallet_test.`,
  );
}