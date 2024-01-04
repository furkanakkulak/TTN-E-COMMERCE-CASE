const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.post('/', orderController.createOrder);
router.put('/:orderId', orderController.editOrder);
router.get('/', orderController.getAllOrders);
router.get('/:id', orderController.getOrderById);
router.delete('/:id', orderController.deleteOrder);

module.exports = router;
