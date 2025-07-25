var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Router } from 'express';
import { getDatabase } from '../database/connection';
import { Product, } from '../models/Product';
import { authenticateToken, requireUserOrAdmin, optionalAuth, } from '../middleware/auth';
const router = Router();
// Helper function to create success response
function createSuccessResponse(data) {
    return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
    };
}
// Helper function to create error response
function createErrorResponse(code, message, details) {
    return {
        success: false,
        error: { code, message, details },
        timestamp: new Date().toISOString(),
    };
}
// Helper function to create paginated response
function createPaginatedResponse(data, page, limit, total) {
    return {
        success: true,
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        timestamp: new Date().toISOString(),
    };
}
// GET /api/products - Get all products (with pagination and search)
router.get('/', optionalAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield getDatabase();
        const productModel = new Product(db);
        // Parse pagination parameters
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
        const offset = (page - 1) * limit;
        // Parse search parameters
        const searchOptions = {
            limit,
            offset,
        };
        if (req.query.q) {
            searchOptions.query = req.query.q;
        }
        if (req.query.category) {
            searchOptions.category = req.query.category;
        }
        if (req.query.minPrice) {
            const minPrice = parseFloat(req.query.minPrice);
            if (!isNaN(minPrice)) {
                searchOptions.minPrice = minPrice;
            }
        }
        if (req.query.maxPrice) {
            const maxPrice = parseFloat(req.query.maxPrice);
            if (!isNaN(maxPrice)) {
                searchOptions.maxPrice = maxPrice;
            }
        }
        if (req.query.inStock !== undefined) {
            searchOptions.inStock = req.query.inStock === 'true';
        }
        if (req.query.tags) {
            const tags = Array.isArray(req.query.tags)
                ? req.query.tags
                : [req.query.tags];
            searchOptions.tags = tags;
        }
        // Get products and total count
        const products = yield productModel.search(searchOptions);
        const total = yield productModel.count({
            query: searchOptions.query,
            category: searchOptions.category,
            minPrice: searchOptions.minPrice,
            maxPrice: searchOptions.maxPrice,
            inStock: searchOptions.inStock,
            tags: searchOptions.tags,
        });
        res.json(createPaginatedResponse(products, page, limit, total));
    }
    catch (error) {
        console.error('Error fetching products:', error);
        res
            .status(500)
            .json(createErrorResponse('FETCH_PRODUCTS_ERROR', 'Failed to fetch products'));
    }
}));
// GET /api/products/search - Search products (alias for GET with query params)
router.get('/search', optionalAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield getDatabase();
        const productModel = new Product(db);
        // Parse pagination parameters
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
        const offset = (page - 1) * limit;
        // Parse search parameters
        const searchOptions = {
            limit,
            offset,
        };
        if (req.query.q) {
            searchOptions.query = req.query.q;
        }
        if (req.query.category) {
            searchOptions.category = req.query.category;
        }
        if (req.query.minPrice) {
            const minPrice = parseFloat(req.query.minPrice);
            if (!isNaN(minPrice)) {
                searchOptions.minPrice = minPrice;
            }
        }
        if (req.query.maxPrice) {
            const maxPrice = parseFloat(req.query.maxPrice);
            if (!isNaN(maxPrice)) {
                searchOptions.maxPrice = maxPrice;
            }
        }
        if (req.query.inStock !== undefined) {
            searchOptions.inStock = req.query.inStock === 'true';
        }
        if (req.query.tags) {
            const tags = Array.isArray(req.query.tags)
                ? req.query.tags
                : [req.query.tags];
            searchOptions.tags = tags;
        }
        // Get products and total count
        const products = yield productModel.search(searchOptions);
        const total = yield productModel.count({
            query: searchOptions.query,
            category: searchOptions.category,
            minPrice: searchOptions.minPrice,
            maxPrice: searchOptions.maxPrice,
            inStock: searchOptions.inStock,
            tags: searchOptions.tags,
        });
        res.json(createPaginatedResponse(products, page, limit, total));
    }
    catch (error) {
        console.error('Error searching products:', error);
        res
            .status(500)
            .json(createErrorResponse('SEARCH_PRODUCTS_ERROR', 'Failed to search products'));
    }
}));
// GET /api/products/categories - Get all product categories
router.get('/categories', optionalAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield getDatabase();
        const productModel = new Product(db);
        const categories = yield productModel.getCategories();
        res.json(createSuccessResponse(categories));
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        res
            .status(500)
            .json(createErrorResponse('FETCH_CATEGORIES_ERROR', 'Failed to fetch categories'));
    }
}));
// GET /api/products/:id - Get product by ID
router.get('/:id', optionalAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const db = yield getDatabase();
        const productModel = new Product(db);
        const product = yield productModel.findById(id);
        if (!product) {
            res
                .status(404)
                .json(createErrorResponse('PRODUCT_NOT_FOUND', 'Product not found'));
            return;
        }
        res.json(createSuccessResponse(product));
    }
    catch (error) {
        console.error('Error fetching product:', error);
        res
            .status(500)
            .json(createErrorResponse('FETCH_PRODUCT_ERROR', 'Failed to fetch product'));
    }
}));
// POST /api/products - Create new product
router.post('/', authenticateToken, requireUserOrAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productData = req.body;
        // Validate required fields
        if (!productData.name ||
            !productData.description ||
            productData.price === undefined ||
            !productData.category) {
            res
                .status(400)
                .json(createErrorResponse('VALIDATION_ERROR', 'Name, description, price, and category are required'));
            return;
        }
        // Validate price
        if (typeof productData.price !== 'number' || productData.price < 0) {
            res
                .status(400)
                .json(createErrorResponse('VALIDATION_ERROR', 'Price must be a non-negative number'));
            return;
        }
        // Validate tags if provided
        if (productData.tags && !Array.isArray(productData.tags)) {
            res
                .status(400)
                .json(createErrorResponse('VALIDATION_ERROR', 'Tags must be an array'));
            return;
        }
        const db = yield getDatabase();
        const productModel = new Product(db);
        // Create product
        const newProduct = yield productModel.create(productData);
        res.status(201).json(createSuccessResponse(newProduct));
    }
    catch (error) {
        console.error('Error creating product:', error);
        res
            .status(500)
            .json(createErrorResponse('CREATE_PRODUCT_ERROR', 'Failed to create product'));
    }
}));
// PUT /api/products/:id - Update product
router.put('/:id', authenticateToken, requireUserOrAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updateData = req.body;
        // Validate price if provided
        if (updateData.price !== undefined) {
            if (typeof updateData.price !== 'number' || updateData.price < 0) {
                res
                    .status(400)
                    .json(createErrorResponse('VALIDATION_ERROR', 'Price must be a non-negative number'));
                return;
            }
        }
        // Validate tags if provided
        if (updateData.tags && !Array.isArray(updateData.tags)) {
            res
                .status(400)
                .json(createErrorResponse('VALIDATION_ERROR', 'Tags must be an array'));
            return;
        }
        const db = yield getDatabase();
        const productModel = new Product(db);
        const updatedProduct = yield productModel.update(id, updateData);
        if (!updatedProduct) {
            res
                .status(404)
                .json(createErrorResponse('PRODUCT_NOT_FOUND', 'Product not found'));
            return;
        }
        res.json(createSuccessResponse(updatedProduct));
    }
    catch (error) {
        console.error('Error updating product:', error);
        res
            .status(500)
            .json(createErrorResponse('UPDATE_PRODUCT_ERROR', 'Failed to update product'));
    }
}));
// DELETE /api/products/:id - Delete product
router.delete('/:id', authenticateToken, requireUserOrAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const db = yield getDatabase();
        const productModel = new Product(db);
        const deleted = yield productModel.delete(id);
        if (!deleted) {
            res
                .status(404)
                .json(createErrorResponse('PRODUCT_NOT_FOUND', 'Product not found'));
            return;
        }
        res.json(createSuccessResponse({ message: 'Product deleted successfully' }));
    }
    catch (error) {
        console.error('Error deleting product:', error);
        res
            .status(500)
            .json(createErrorResponse('DELETE_PRODUCT_ERROR', 'Failed to delete product'));
    }
}));
export default router;
