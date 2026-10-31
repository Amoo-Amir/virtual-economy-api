const express = require("express");
const authcontroller = require("../controllers/auth.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");

const {
  registerSchema,
  loginSchema,
} = require("../validations/auth.validation");

const router = express.Router();

router.post(
  "/auth/register",
  validate(registerSchema),
  authcontroller.register,
);

router.post("/auth/login", validate(loginSchema), authcontroller.login);

router.get("/auth/profile", authenticate, authcontroller.me);
// router.get("/auth/:userId", authenticate, authcontroller.getUserById);

module.exports = router;
