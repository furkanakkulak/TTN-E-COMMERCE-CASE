const Coupon = require('../models/Coupon');
const logger = require('../pkg/logger');
const { getAsync, redisClient } = require('../utils/redis');

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
    redisClient.del('coupons', (err, reply) => {
      if (err) {
        logger.error('Redis error:', err);
      } else {
        logger.info('Data del successfully.');
      }
    });
    return { coupon: newCoupon };
  } catch (error) {
    return { error: error.message };
  }
};

const getAllCoupons = async () => {
  try {
    const cache = await getAsync('coupons');

    if (cache === null) {
      logger.info('Data not found');
      const coupons = await Coupon.findAll();

      redisClient.set('coupons', JSON.stringify(coupons), (err, reply) => {
        if (err) {
          logger.error('Redis error:', err);
        } else {
          logger.info('Data set successfully.');
        }
      });

      logger.info('Data retrieved successfully: Database');
      return coupons;
    } else {
      logger.info('Data retrieved successfully: Redis cache');
      return JSON.parse(cache);
    }
  } catch (error) {
    logger.error('Error:', error);
    throw error;
  }
};

const getCouponById = async (couponId) => {
  try {
    const cache = await getAsync(`coupon${couponId}`);

    if (cache === null) {
      logger.info('Data not found');
      const coupon = await Coupon.findByPk(couponId);

      if (coupon) {
        redisClient.set(
          `coupon${couponId}`,
          JSON.stringify(coupon),
          (err, reply) => {
            if (err) {
              logger.error('Redis error:', err);
            } else {
              logger.info('Data set successfully.');
            }
          }
        );
      } else {
        return { error: 'Coupon not found.' };
      }

      logger.info('Data retrieved successfully: Database');
      return coupon;
    } else {
      logger.info('Data retrieved successfully: Redis cache');
      return JSON.parse(cache);
    }
  } catch (error) {
    logger.error('Error:', error);
    throw error;
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
      redisClient.del(['coupons', `coupon${couponId}`], (err, reply) => {
        if (err) {
          logger.error('Redis error:', err);
        } else {
          logger.info('Data del successfully.');
        }
      });
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
      redisClient.del(['coupons', `coupon${couponId}`], (err, reply) => {
        if (err) {
          logger.error('Redis error:', err);
        } else {
          logger.info('Data del successfully.');
        }
      });
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
