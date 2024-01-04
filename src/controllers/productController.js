const Joi = require('joi');
const ProductService = require('../services/productService');
const ProductValidation = require('../validation/productValidation');
const logger = require('../pkg/logger');

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const products = await ProductService.getAllProducts();
    res.json(products);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get a product by ID
const getProductById = async (req, res) => {
  const productId = req.params.productId;

  try {
    const product = await ProductService.getProductById(productId);

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Create a new product
const createProduct = async (req, res) => {
  const productData = req.body;

  // Validate product data using Joi
  const { error } = ProductValidation.productSchema.validate(productData);
  if (error) {
    // Return validation error with a 400 Bad Request status code
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const newProduct = await ProductService.createProduct(productData);
    res.status(201).json(newProduct);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Update a product
const updateProduct = async (req, res) => {
  const productId = req.params.productId;
  const updatedProductData = req.body;

  // Validate updated product data using Joi
  const { error } =
    ProductValidation.productSchema.validate(updatedProductData);
  if (error) {
    // Return validation error with a 400 Bad Request status code
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const updatedProduct = await ProductService.updateProduct(
      productId,
      updatedProductData
    );

    if (updatedProduct) {
      res.json(updatedProduct);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Delete a product
const deleteProduct = async (req, res) => {
  const productId = req.params.productId;

  try {
    const result = await ProductService.deleteProduct(productId);

    if (result) {
      res.json({ message: 'Product deleted successfully' });
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
