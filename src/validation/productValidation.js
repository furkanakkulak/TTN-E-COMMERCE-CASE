const Joi = require('joi');

const productSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow(''),
  price: Joi.number().required(),
  stockQuantity: Joi.number().integer().required(),
  origin: Joi.string().required(),
  roastLevel: Joi.string().allow(''),
  flavorNotes: Joi.array().items(Joi.string()),
  categoryId: Joi.number().integer().required(),
});

const partialUpdateProductSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string().allow(''),
  price: Joi.number(),
  stockQuantity: Joi.number().integer(),
  origin: Joi.string(),
  roastLevel: Joi.string().allow(''),
  flavorNotes: Joi.array().items(Joi.string()),
  categoryId: Joi.number().integer(),
});

module.exports = {
  productSchema,
  partialUpdateProductSchema,
};
