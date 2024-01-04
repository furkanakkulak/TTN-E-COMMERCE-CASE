const Product = require('../models/Product');
const Category = require('../models/Category');
const { redisClient, getAsync } = require('../utils/redis');
const logger = require('../pkg/logger');

const mapProductData = (data, options = {}) => {
  const { excludeTimestamps = true } = options;

  const result = {
    id: data.id,
    title: data.title,
    description: data.description,
    price: data.price,
    stockQuantity: data.stockQuantity,
    origin: data.origin,
    roastLevel: data.roastLevel,
    flavorNotes: data.flavorNotes,
    categoryId: data.categoryId,
    categoryTitle: data.Category ? data.Category.title : null,
  };

  if (!excludeTimestamps) {
    result.createdAt = data.createdAt;
    result.updatedAt = data.updatedAt;
  }

  return result;
};

const getAllProducts = async () => {
  try {
    const cache = await getAsync('products');

    if (cache === null) {
      logger.info('Data not found');
      const products = await Product.findAll({
        include: Category,
      });

      redisClient.set(
        'products',
        JSON.stringify(products.map((product) => mapProductData(product))),
        (err, reply) => {
          if (err) {
            logger.error('Redis error:', err);
          } else {
            logger.info('Data set successfully.');
          }
        }
      );

      logger.info('Data retrieved successfully: Database');
      return products.map((product) => mapProductData(product));
    } else {
      logger.info('Data retrieved successfully: Redis cache');
      return JSON.parse(cache);
    }
  } catch (error) {
    logger.error('Error:', error);
    throw error;
  }
};

const getProductById = async (productId) => {
  try {
    const cache = await getAsync(`product${productId}`);

    if (cache === null) {
      logger.info('Data not found');
      const product = await Product.findByPk(productId, {
        include: Category,
      });

      if (product) {
        redisClient.set(
          `product${productId}`,
          JSON.stringify(mapProductData(product)),
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
      return mapProductData(product);
    } else {
      logger.info('Data retrieved successfully: Redis cache');
      return JSON.parse(cache);
    }
  } catch (error) {
    logger.error('Error:', error);
    throw error;
  }
};

const updateProductStock = async (productId, quantity) => {
  const product = await Product.findByPk(productId);
  if (!product) {
    throw new Error(`Product with ID ${productId} not found.`);
  }
  product.stockQuantity -= quantity;
  await product.save();
  redisClient.del(['products', `product${productId}`], (err, reply) => {
    if (err) {
      logger.error('Redis error:', err);
    } else {
      logger.info('Data del successfully.');
    }
  });
  redisClient.del(`products`, (err, reply) => {
    if (err) {
      logger.error('Redis error:', err);
    } else {
      logger.info('Data del successfully.');
    }
  });
};

const createProduct = async (productData) => {
  const newProduct = await Product.create(productData);
  redisClient.del(`products`, (err, reply) => {
    if (err) {
      logger.error('Redis error:', err);
    } else {
      logger.info('Data del successfully.');
    }
  });
  return mapProductData(newProduct);
};

const updateProduct = async (productId, updatedProductData) => {
  const updatedProduct = await Product.findByPk(productId);

  if (updatedProduct) {
    await updatedProduct.update(updatedProductData);
    redisClient.del(['products', `product${productId}`], (err, reply) => {
      if (err) {
        logger.error('Redis error:', err);
      } else {
        logger.info('Data del successfully.');
      }
    });
    return mapProductData(updatedProduct);
  } else {
    return null;
  }
};

const deleteProduct = async (productId) => {
  const result = await Product.destroy({
    where: {
      id: productId,
    },
  });

  redisClient.del(['products', `product${productId}`], (err, reply) => {
    if (err) {
      logger.error('Redis error:', err);
    } else {
      logger.info('Data del successfully.');
    }
  });

  return result > 0; // Returns true if any rows were deleted
};

module.exports = {
  getAllProducts,
  getProductById,
  updateProductStock,
  createProduct,
  updateProduct,
  deleteProduct,
};
