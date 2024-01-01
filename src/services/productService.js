const Product = require('../models/Product');
const Category = require('../models/Category');

// Map product data for consistent response format
const mapProductData = (data, options = {}) => {
  const { excludeTimestamps = true } = options;

  // Create a standardized result object
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
    categoryTitle: data.Category ? data.Category.title : undefined,
  };

  // Include timestamps if the option is not excluded
  if (!excludeTimestamps) {
    result.createdAt = data.createdAt;
    result.updatedAt = data.updatedAt;
  }

  return result;
};

// Retrieve all products with category information
const getAllProducts = async () => {
  const products = await Product.findAll({
    include: Category,
  });
  return products.map((product) => mapProductData(product));
};

// Retrieve a product by ID with category information
const getProductById = async (productId) => {
  const product = await Product.findByPk(productId, {
    include: Category,
  });

  // Return null if the product is not found
  if (!product) {
    return null;
  }

  return mapProductData(product);
};

// Update product stock quantity
const updateProductStock = async (productId, quantity) => {
  const product = await Product.findByPk(productId);
  // Throw an error if the product is not found
  if (!product) {
    throw new Error(`Product with ID ${productId} not found.`);
  }

  // Update stock quantity and save the changes
  product.stockQuantity -= quantity;
  await product.save();
};

// Create a new product
const createProduct = async (productData) => {
  const newProduct = await Product.create(productData);
  return mapProductData(newProduct);
};

// Update a product
const updateProduct = async (productId, updatedProductData) => {
  const updatedProduct = await Product.findByPk(productId);

  // Check if the product exists before updating
  if (updatedProduct) {
    // Use sequelize's update method for full update
    await updatedProduct.update(updatedProductData);
    return mapProductData(updatedProduct);
  } else {
    return null;
  }
};

// Partially update a product
const partialUpdateProduct = async (productId, updatedProductData) => {
  const updatedProduct = await Product.findByPk(productId);

  // Check if the product exists before updating
  if (updatedProduct) {
    // Use sequelize's partial update method
    await updatedProduct.update(updatedProductData);
    return mapProductData(updatedProduct);
  } else {
    return null;
  }
};

// Delete a product by ID
const deleteProduct = async (productId) => {
  // Delete the product and return true if any rows were deleted
  const result = await Product.destroy({
    where: {
      id: productId,
    },
  });

  return result > 0;
};

module.exports = {
  getAllProducts,
  getProductById,
  updateProductStock,
  createProduct,
  updateProduct,
  deleteProduct,
  partialUpdateProduct,
};
