const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');

router.post('/validate', couponController.validateCoupon);
router.post('/', couponController.addCoupon);
router.get('/', couponController.getAllCoupons);
router.get('/:id', couponController.getCouponById);
router.put('/:id', couponController.updateCoupon);
router.delete('/:id', couponController.deactivateCoupon);

module.exports = router;
