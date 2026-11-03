const Joi = require("joi");

const createListingSchema = Joi.object({
  itemId: Joi.string().guid().required().messages({
    "string.guid": "Item ID must be a valid UUID",
  }),

  quantity: Joi.number().integer().positive().max(2147483647).required(),

  unitPrice: Joi.string()
    .pattern(/^(?=.*[1-9])(?:0|[1-9]\d{0,17})(?:\.\d{1,18})?$/)
    .required()
    .messages({
      "string.pattern.base":
        "Unit price must be positive and have at most 18 integer and 18 decimal digits",
    }),
});

module.exports = {
  createListingSchema,
};
