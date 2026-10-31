const express = require("express");
const transactionController = require("../controllers/transactions.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get(
  "/transactions",
  authenticate,
  transactionController.getMyTransactions,
);

module.exports = router;
