const express = require("express");
const walletController = require("../controllers/wallet.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/wallet/myWallet", authenticate, walletController.getWalletInfo);

module.exports = router;
