const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');

router.get('/', ProductController.getAllProducts);
router.get('/:productId', ProductController.getProductById);
router.post('/', ProductController.createProduct);
router.put('/:productId', ProductController.updateProduct);
router.patch('/:productId', ProductController.partialUpdateProduct);
router.delete('/:productId', ProductController.deleteProduct);

module.exports = router;
