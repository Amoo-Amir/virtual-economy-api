const express = require("express");
const walletController = require("../controllers/wallet.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/wallet/resolve-card", authenticate, walletController.resolveCard);
router.post("/wallet/transfer", authenticate, walletController.transfer);

router.get("/wallet/myWallet", authenticate, walletController.getWalletInfo);

module.exports = router;
