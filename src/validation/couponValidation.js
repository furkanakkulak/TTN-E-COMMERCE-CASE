const Joi = require('joi');

const couponSchema = Joi.object({
  code: Joi.string().required(),
  isActive: Joi.boolean().optional(),
});

module.exports = {
  couponSchema,
};
