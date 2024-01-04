const orderService = require('../services/orderService');
const {
  newOrderSchema,
  updateOrderSchema,
} = require('../validation/orderValidation');

const createOrder = async (req, res, next) => {
  try {
    const { cart, couponCode } = req.body;

    const { error } = newOrderSchema.validate({ cart, couponCode });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const order = await orderService.createOrder(cart, couponCode);

    if (order.error) {
      return res.status(400).json({ error: order.error });
    }

    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
const editOrder = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const { cart, couponCode } = req.body;

    const { error } = updateOrderSchema.validate({
      cart: cart,
    });

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const updatedOrder = await orderService.updateOrder(
      orderId,
      cart,
      couponCode
    );

    if (updatedOrder.error) {
      return res.status(400).json({ error: updatedOrder.error });
    }

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await orderService.getAllOrders();
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getOrderById = async (req, res) => {
  const orderId = req.params.id;

  try {
    const order = await orderService.getOrderById(orderId);

    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteOrder = async (req, res) => {
  const orderId = req.params.id;

  try {
    const result = await orderService.deleteOrder(orderId);

    if (result.error) {
      res.status(404).json({ error: result.error });
      return;
    }

    res.status(204).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  deleteOrder,
};
module.exports = {
  createOrder,
  editOrder,
  getAllOrders,
  getOrderById,
  deleteOrder,
};
