const CouponService = require('../services/couponService');
const { couponSchema } = require('../validation/couponValidation');

const validateCoupon = async (req, res) => {
  const { couponCode } = req.params;
  const result = await CouponService.validateCoupon(couponCode);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  return res.json(result);
};

const addCoupon = async (req, res) => {
  const { code } = req.body;
  const { error } = couponSchema.validate({
    code,
  });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const result = await CouponService.addCoupon({ code });
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }
  return res.json(result);
};

const getAllCoupons = async (req, res) => {
  const result = await CouponService.getAllCoupons();
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }
  return res.json(result);
};

const getCouponById = async (req, res) => {
  const { couponId } = req.params;
  const result = await CouponService.getCouponById(couponId);
  if (result.error) {
    return res.status(404).json({ error: result.error });
  }
  return res.json(result);
};

const updateCoupon = async (req, res) => {
  const { id } = req.params;
  const { code, isActive } = req.body;
  const { error } = couponSchema.validate({
    code,
    isActive,
  });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  const result = await CouponService.updateCoupon(id, {
    code,
    isActive,
  });
  if (result.error) {
    return res.status(404).json({ error: result.error });
  }
  return res.json(result);
};

const deactivateCoupon = async (req, res) => {
  const { id } = req.params;
  const result = await CouponService.deactivateCoupon(id);
  if (result.error) {
    return res.status(404).json({ error: result.error });
  }
  return res.json(result);
};

module.exports = {
  validateCoupon,
  addCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deactivateCoupon,
};
