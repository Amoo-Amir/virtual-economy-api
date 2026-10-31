const Joi = require("joi");

const registerSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .max(254)
    .required(),

  password: Joi.string()
    .min(8)
    .custom((value, helpers) => {
      if (Buffer.byteLength(value, "utf8") > 72) {
        return helpers.error("string.max", { limit: 72 });
      }

      return value;
    })
    .messages({
      "string.max": "Password must not exceed 72 bytes",
    })
    .required(),
});

const loginSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .max(254)
    .required(),

  password: Joi.string()
    .required(),
});

module.exports = {
  registerSchema,
  loginSchema,
};