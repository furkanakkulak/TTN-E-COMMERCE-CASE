const Joi = require('joi');

const cartItemSchema = Joi.object({
  itemId: Joi.number().required(),
  quantity: Joi.number().integer().min(1).required(),
});

const newCartSchema = Joi.array().items(cartItemSchema).min(1).required();

const newOrderSchema = Joi.object({
  cart: newCartSchema,
  couponCode: Joi.string().allow('').optional(), // optional coupon code
});

const updateOrderSchema = Joi.object({
  cart: newCartSchema,
  couponCode: Joi.string().allow('').optional(), // optional coupon code
});

module.exports = {
  newOrderSchema,
  updateOrderSchema,
};
