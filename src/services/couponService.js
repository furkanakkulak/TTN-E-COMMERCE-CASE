const Coupon = require('../models/Coupon');

const validateCouponFormat = (couponCode) => {
  const regex = /\d.*T{3,}.*\d/;
  return regex.test(couponCode);
};

const validateCoupon = async (couponCode) => {
  const isValidFormat = validateCouponFormat(couponCode);

  if (!isValidFormat) {
    return { isValid: false, message: 'Invalid coupon code format' };
  }

  const existingCoupon = await Coupon.findOne({ where: { code: couponCode } });

  return {
    isValid: !!existingCoupon,
    coupon: existingCoupon,
    message: existingCoupon
      ? existingCoupon.isActive
        ? 'Coupon is valid.'
        : 'Coupon is not active.'
      : 'Invalid coupon code.',
  };
};

const addCoupon = async ({ code }) => {
  try {
    const newCoupon = await Coupon.create({
      code,
      isActive: true,
    });
    return { coupon: newCoupon };
  } catch (error) {
    return { error: error.message };
  }
};

const getAllCoupons = async () => {
  try {
    const coupons = await Coupon.findAll();
    return { coupons };
  } catch (error) {
    return { error: error.message };
  }
};

const getCouponById = async (couponId) => {
  try {
    const coupon = await Coupon.findByPk(couponId);
    if (coupon) {
      return { coupon };
    } else {
      return { error: 'Coupon not found.' };
    }
  } catch (error) {
    return { error: error.message };
  }
};

const updateCoupon = async (couponId, { code, isActive }) => {
  try {
    const updatedCoupon = await Coupon.findByPk(couponId);
    if (updatedCoupon) {
      updatedCoupon.code = code;
      if (isActive) {
        updatedCoupon.isActive = isActive;
      }
      await updatedCoupon.save();
      return { coupon: updatedCoupon };
    } else {
      return { error: 'Coupon not found.' };
    }
  } catch (error) {
    return { error: error.message };
  }
};

const deactivateCoupon = async (couponId) => {
  try {
    const coupon = await Coupon.findByPk(couponId);
    if (coupon) {
      coupon.isActive = false;
      await coupon.save();
      return { message: 'Coupon deactivated successfully.' };
    } else {
      return { error: 'Coupon not found.' };
    }
  } catch (error) {
    return { error: error.message };
  }
};

module.exports = {
  validateCoupon,
  addCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deactivateCoupon,
};
