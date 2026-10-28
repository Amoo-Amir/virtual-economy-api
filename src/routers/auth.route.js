const express = require("express");
const authcontroller = require("../controllers/auth.controller");
const {authenticate} = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/auth/register", authcontroller.register);

router.post("/auth/login", authcontroller.login);

router.get("/auth/profile", authenticate, authcontroller.me);
router.get("/auth/:userId", authenticate, authcontroller.getUserById);


module.exports = router;
