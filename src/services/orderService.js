const Order = require('../models/Order');
const CartItem = require('../models/CartItem');
const ProductService = require('./productService');
const CouponService = require('./couponService');
const Product = require('../models/Product');
const { redisClient, getAsync } = require('../utils/redis');
const logger = require('../pkg/logger');

const calculateCartTotal = (cartItems) => {
  return cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
};

const hasCoffeeItem = (cartItems) => {
  return (
    cartItems &&
    cartItems.length > 0 &&
    cartItems.some((item) => item.product && item.product.id === 1)
  );
};

const calculateCartTotalDiscount = (cartTotal) => {
  let discount = 0;

  if (cartTotal >= 3000) {
    discount = 0.25; // 25% discount for cart total over 3000 TL
  } else if (cartTotal >= 2000) {
    discount = 0.2; // 20% discount for cart total over 2000 TL
  } else if (cartTotal >= 1500) {
    discount = 0.15; // 15% discount for cart total over 1500 TL
  } else if (cartTotal >= 1000) {
    discount = 0.1; // 10% discount for cart total over 1000 TL
  }

  return cartTotal * discount;
};

const createOrder = async (cart, couponCode) => {
  try {
    // Check if the cart contains manually added coffee
    if (cart.some((item) => item.itemId === 1)) {
      return { error: 'Adding coffee manually is not allowed.' };
    }

    // Fetch products from the cart asynchronously
    const products = await Promise.all(
      cart.map(async (item) => {
        const product = await ProductService.getProductById(item.itemId);

        // Validate product existence and stock quantity
        if (!product) {
          throw new Error(`Product with ID ${item.itemId} not found.`);
        }
        if (item.quantity > product.stockQuantity) {
          throw new Error(`Insufficient stock for product ${item.itemId}.`);
        }

        return { product, quantity: item.quantity };
      })
    );

    // Calculate the total amount of the cart
    const totalAmount = calculateCartTotal(products);

    // Initialize variables for discounts and shipping fee
    let discountAmount = 0;
    let couponId = null;
    let shippingFee = totalAmount >= 500 ? 0 : 54.99;

    // Check if a coupon code is provided and valid
    if (couponCode) {
      const couponValidation = await CouponService.validateCoupon(couponCode);

      if (couponValidation.isValid && couponValidation.coupon.isActive) {
        // If the coupon is valid, calculate the discount and update shipping fee
        const cartTotalWithDiscount =
          totalAmount - calculateCartTotalDiscount(totalAmount);
        discountAmount = totalAmount - cartTotalWithDiscount;

        // Update shipping fee based on total amount after coupon discount
        shippingFee = cartTotalWithDiscount >= 500 ? 0 : 54.99;

        couponId = couponValidation.coupon.id;
      } else {
        // If the coupon code is invalid, throw an error
        throw new Error(couponValidation.message);
      }
    }

    // Calculate the net amount after discounts and shipping fee
    const netAmount = totalAmount - discountAmount + shippingFee;

    // Create the order in the database
    const order = await Order.create({
      totalAmount,
      shippingFee,
      discountRate: couponId
        ? Math.floor((discountAmount / totalAmount) * 100)
        : 0,
      discountAmount,
      netAmount,
      couponId,
    });

    // Create CartItem entries for each product in the order
    await Promise.all(
      products.map(async (item) => {
        await CartItem.create({
          quantity: item.quantity,
          orderId: order.id,
          productId: item.product.id,
        });

        // Update product stock in the database
        await ProductService.updateProductStock(item.product.id, item.quantity);
      })
    );

    // Calculate discount rate
    const discountRate =
      couponCode && totalAmount > 0 ? (discountAmount / totalAmount) * 100 : 0;

    // Check if a free coffee should be added to the order
    if (couponId && totalAmount >= 3000 && !hasCoffeeItem(order.CartItems)) {
      const coffeeProduct = await ProductService.getProductById(1);

      if (coffeeProduct) {
        // Add a CartItem entry for the free coffee
        await CartItem.create({
          quantity: 1,
          orderId: order.id,
          productId: coffeeProduct.id,
        });

        // Update product stock for the free coffee
        await ProductService.updateProductStock(coffeeProduct.id, 1);

        // Add the free coffee to the products array
        products.push({
          product: {
            ...coffeeProduct,
            quantity: 1,
          },
        });
      }
    }
    redisClient.del('orders', (err, reply) => {
      if (err) {
        logger.error('Redis error:', err);
      } else {
        logger.info('Data del successfully.');
      }
    });

    return {
      id: order.id,
      totalAmount,
      shippingFee,
      discountRate: Math.floor(discountRate),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      netAmount: parseFloat(netAmount.toFixed(2)),
      couponId,
      cart: products.map((item) => ({
        itemId: item.product.id,
        title: item.product.title,
        quantity: item.quantity,
      })),
    };
  } catch (error) {
    // Handle errors and return an error response
    return { error: error.message };
  }
};

const updateOrder = async (orderId, updatedCart, newCouponCode) => {
  try {
    // Retrieve the existing order
    const order = await Order.findByPk(orderId, {
      include: [{ model: CartItem, include: [{ model: Product }] }],
    });

    if (!order) {
      return { error: 'Order not found.' };
    }

    // Check if the updated cart contains manually added coffee
    if (updatedCart.some((item) => item.itemId === 1)) {
      return { error: 'Manually adding coffee is not allowed.' };
    }

    // Fetch products from the updated cart asynchronously
    const updatedProducts = await Promise.all(
      updatedCart.map(async (item) => {
        const product = await ProductService.getProductById(item.itemId);

        // Validate product existence and stock quantity
        if (!product) {
          throw new Error(`Product with ID ${item.itemId} not found.`);
        }

        // Check if the quantity in the updated cart exceeds the available stock
        const existingCartItem = order.CartItems.find(
          (existingItem) => existingItem.productId === item.itemId
        );

        const availableStock =
          product.stockQuantity +
          (existingCartItem ? existingCartItem.quantity : 0);

        if (item.quantity > availableStock) {
          throw new Error(`Insufficient stock for product ${item.itemId}.`);
        }

        return { product, quantity: item.quantity };
      })
    );

    // Calculate the total amount of the updated cart
    const updatedTotalAmount = calculateCartTotal(updatedProducts);

    // Initialize variables for discounts and shipping fee
    let discountAmount = 0;
    let couponId = null;
    let shippingFee = updatedTotalAmount >= 500 ? 0 : 54.99;

    // Check if a new coupon code is provided and valid
    if (newCouponCode) {
      if (!order.couponId) {
        const couponValidation = await CouponService.validateCoupon(
          newCouponCode
        );

        if (couponValidation.isValid && couponValidation.coupon.isActive) {
          // If the coupon is valid, apply discount and update shipping fee
          couponId = couponValidation.coupon.id;

          // Calculate discount based on cart total using your existing function
          discountAmount = calculateCartTotalDiscount(updatedTotalAmount);
        } else {
          // If the coupon code is invalid, throw an error
          throw new Error(couponValidation.message);
        }
      } else {
        // If a coupon is already applied, new coupon cannot be added
        throw new Error('Coupon code cannot be changed.');
      }
    } else if (order.couponId) {
      // If no new coupon code is provided, and there is an existing coupon, recalculate discount
      const cartTotalWithDiscount =
        updatedTotalAmount - calculateCartTotalDiscount(updatedTotalAmount);
      discountAmount = updatedTotalAmount - cartTotalWithDiscount;

      // Update shipping fee based on total amount after coupon discount
      shippingFee = cartTotalWithDiscount >= 500 ? 0 : 54.99;

      couponId = order.couponId;
    }

    // Calculate the net amount after discounts and shipping fee
    const updatedNetAmount = updatedTotalAmount - discountAmount + shippingFee;

    // Update the order in the database with new values
    await order.update({
      totalAmount: updatedTotalAmount,
      shippingFee,
      discountRate: couponId
        ? Math.floor((discountAmount / updatedTotalAmount) * 100)
        : 0,
      discountAmount,
      netAmount: updatedNetAmount,
      couponId,
    });

    // Identify changes in the cart and update CartItem entries
    await Promise.all(
      order.CartItems.map(async (existingCartItem) => {
        const updatedCartItem = updatedProducts.find(
          (item) => item.product.id === existingCartItem.productId
        );

        if (updatedCartItem) {
          // Update existing CartItem entry
          const quantityChange =
            updatedCartItem.quantity - existingCartItem.quantity;
          await existingCartItem.update({ quantity: updatedCartItem.quantity });

          // Update product stock based on the change in quantity
          await ProductService.updateProductStock(
            updatedCartItem.product.id,
            quantityChange
          );
        } else {
          // Remove CartItem entry if it is not in the updated cart
          await existingCartItem.destroy();

          // Restore product stock for the removed item
          await ProductService.updateProductStock(
            existingCartItem.productId,
            -existingCartItem.quantity
          );
        }
      })
    );

    // Identify new items in the updated cart and add CartItem entries
    const newItems = updatedProducts.filter(
      (updatedCartItem) =>
        !order.CartItems.some(
          (existingCartItem) =>
            existingCartItem.productId === updatedCartItem.product.id
        )
    );

    await Promise.all(
      newItems.map(async (newItem) => {
        // Add CartItem entry for the new item
        await CartItem.create({
          quantity: newItem.quantity,
          orderId: order.id,
          productId: newItem.product.id,
        });

        // Update product stock for the new item
        await ProductService.updateProductStock(
          newItem.product.id,
          newItem.quantity
        );
      })
    );

    // Check if a free coffee should be added to the order
    const hasCoffee = hasCoffeeItem(order.CartItems);
    if (!hasCoffee && updatedTotalAmount >= 3000 && order.couponId) {
      const coffeeProduct = await ProductService.getProductById(1);

      if (coffeeProduct) {
        // Add a CartItem entry for the free coffee
        await CartItem.create({
          quantity: 1,
          orderId: order.id,
          productId: coffeeProduct.id,
        });

        // Update product stock for the free coffee
        await ProductService.updateProductStock(coffeeProduct.id, 1);

        // Add the free coffee to the products array
        updatedProducts.push({
          product: {
            ...coffeeProduct,
          },
          quantity: 1,
        });
      }
    } else if (hasCoffee && updatedTotalAmount < 3000) {
      // Remove coffee from the cart if it exists and the total is less than 3000
      const coffeeCartItem = updatedProducts.find(
        (item) => item.product.id === 1
      );

      if (coffeeCartItem) {
        // Remove CartItem entry for the coffee
        await CartItem.destroy({
          where: {
            orderId: order.id,
            productId: 1,
          },
        });

        // Update product stock for the removed coffee
        await ProductService.updateProductStock(1, -1);
      }
    }
    redisClient.del(['orders', `order${orderId}`], (err, reply) => {
      if (err) {
        logger.error('Redis error:', err);
      } else {
        logger.info('Data del successfully.');
      }
    });

    // Return the updated order details
    return {
      id: order.id,
      totalAmount: updatedTotalAmount,
      shippingFee,
      discountRate: couponId
        ? Math.floor((discountAmount / updatedTotalAmount) * 100)
        : 0,
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      netAmount: parseFloat(updatedNetAmount.toFixed(2)),
      couponId,
      cart: updatedProducts.map((item) => ({
        itemId: item.product.id,
        title: item.product.title,
        quantity: item.quantity,
      })),
    };
  } catch (error) {
    // Handle errors and return an error response
    return { error: error.message };
  }
};

const getAllOrders = async () => {
  try {
    const cache = await getAsync('orders');

    if (cache === null) {
      logger.info('Data not found');
      const orders = await Order.findAll({
        include: [{ model: CartItem, include: [{ model: Product }] }],
      });

      const formattedOrders = orders.map((order) => ({
        id: order.id,
        totalAmount: order.totalAmount,
        shippingFee: order.shippingFee,
        discountRate: order.discountRate,
        discountAmount: order.discountAmount,
        netAmount: order.netAmount,
        couponId: order.couponId,
        cart: order.CartItems.map((item) => ({
          itemId: item.Product.id,
          title: item.Product.title,
          quantity: item.quantity,
        })),
      }));

      redisClient.set(
        'orders',
        JSON.stringify(formattedOrders),
        (err, reply) => {
          if (err) {
            logger.error('Redis error:', err);
          } else {
            logger.info('Data set successfully.');
          }
        }
      );

      logger.info('Data retrieved successfully: Database');
      return formattedOrders;
    } else {
      logger.info('Data retrieved successfully: Redis cache');
      return JSON.parse(cache);
    }
  } catch (error) {
    logger.error('Error:', error);
    throw error;
  }
};

const getOrderById = async (orderId) => {
  try {
    const cache = await getAsync(`order${orderId}`);

    if (cache === null) {
      logger.info('Data not found');
      const order = await Order.findByPk(orderId, {
        include: [{ model: CartItem, include: [{ model: Product }] }],
      });

      if (!order) {
        throw new Error('Order not found.');
      }

      const formattedData = {
        id: order.id,
        totalAmount: order.totalAmount,
        shippingFee: order.shippingFee,
        discountRate: order.discountRate,
        discountAmount: order.discountAmount,
        netAmount: order.netAmount,
        couponId: order.couponId,
        cart: order.CartItems.map((item) => ({
          itemId: item.Product.id,
          title: item.Product.title,
          quantity: item.quantity,
        })),
      };

      if (formattedData) {
        redisClient.set(
          `order${orderId}`,
          JSON.stringify(formattedData),
          (err, reply) => {
            if (err) {
              logger.error('Redis error:', err);
            } else {
              logger.info('Data set successfully.');
            }
          }
        );
      }

      logger.info('Data retrieved successfully: Database');
      return formattedData;
    } else {
      logger.info('Data retrieved successfully: Redis cache');
      return JSON.parse(cache);
    }
  } catch (error) {
    logger.error('Error:', error);
    throw error;
  }
};

const deleteOrder = async (orderId) => {
  try {
    // Retrieve the existing order
    const order = await Order.findByPk(orderId, {
      include: [{ model: CartItem }],
    });

    if (!order) {
      throw new Error('Order not found.');
    }

    // Delete CartItem entries and update product stock
    await Promise.all(
      order.CartItems.map(async (cartItem) => {
        // Remove CartItem entry
        await cartItem.destroy();

        // Restore product stock for the removed item
        await ProductService.updateProductStock(
          cartItem.productId,
          -cartItem.quantity
        );
      })
    );

    // Delete the order itself
    await order.destroy();

    redisClient.del(['orders', `order${orderId}`], (err, reply) => {
      if (err) {
        logger.error('Redis error:', err);
      } else {
        logger.info('Data del successfully.');
      }
    });

    return { message: 'Order deleted successfully.' };
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  createOrder,
  updateOrder,
  getAllOrders,
  getOrderById,
  deleteOrder,
};
