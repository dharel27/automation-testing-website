import { Router, Response } from 'express';
import { getDatabase } from '../database/connection';
import {
  Product,
  CreateProductInput,
  UpdateProductInput,
  ProductSearchOptions,
} from '../models/Product';
import {
  AuthenticatedRequest,
  authenticateToken,
  requireUserOrAdmin,
  optionalAuth,
} from '../middleware/auth';

const router = Router();

// Response interfaces
interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
}

// Helper function to create success response
function createSuccessResponse<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}

// Helper function to create error response
function createErrorResponse(
  code: string,
  message: string,
  details?: any
): ErrorResponse {
  return {
    success: false,
    error: { code, message, details },
    timestamp: new Date().toISOString(),
  };
}

// Helper function to create paginated response
function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
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
router.get(
  '/',
  optionalAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const db = await getDatabase();
      const productModel = new Product(db);

      // Parse pagination parameters
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(
        100,
        Math.max(1, parseInt(req.query.limit as string) || 10)
      );
      const offset = (page - 1) * limit;

      // Parse search parameters
      const searchOptions: ProductSearchOptions = {
        limit,
        offset,
      };

      if (req.query.q) {
        searchOptions.query = req.query.q as string;
      }

      if (req.query.category) {
        searchOptions.category = req.query.category as string;
      }

      if (req.query.minPrice) {
        const minPrice = parseFloat(req.query.minPrice as string);
        if (!isNaN(minPrice)) {
          searchOptions.minPrice = minPrice;
        }
      }

      if (req.query.maxPrice) {
        const maxPrice = parseFloat(req.query.maxPrice as string);
        if (!isNaN(maxPrice)) {
          searchOptions.maxPrice = maxPrice;
        }
      }

      if (req.query.inStock !== undefined) {
        searchOptions.inStock = req.query.inStock === 'true';
      }

      if (req.query.tags) {
        const tags = Array.isArray(req.query.tags)
          ? (req.query.tags as string[])
          : [req.query.tags as string];
        searchOptions.tags = tags;
      }

      // Get products and total count
      const products = await productModel.search(searchOptions);
      const total = await productModel.count({
        query: searchOptions.query,
        category: searchOptions.category,
        minPrice: searchOptions.minPrice,
        maxPrice: searchOptions.maxPrice,
        inStock: searchOptions.inStock,
        tags: searchOptions.tags,
      });

      res.json(createPaginatedResponse(products, page, limit, total));
    } catch (error) {
      console.error('Error fetching products:', error);
      res
        .status(500)
        .json(
          createErrorResponse(
            'FETCH_PRODUCTS_ERROR',
            'Failed to fetch products'
          )
        );
    }
  }
);

// GET /api/products/search - Search products (alias for GET with query params)
router.get(
  '/search',
  optionalAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const db = await getDatabase();
      const productModel = new Product(db);

      // Parse pagination parameters
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(
        100,
        Math.max(1, parseInt(req.query.limit as string) || 10)
      );
      const offset = (page - 1) * limit;

      // Parse search parameters
      const searchOptions: ProductSearchOptions = {
        limit,
        offset,
      };

      if (req.query.q) {
        searchOptions.query = req.query.q as string;
      }

      if (req.query.category) {
        searchOptions.category = req.query.category as string;
      }

      if (req.query.minPrice) {
        const minPrice = parseFloat(req.query.minPrice as string);
        if (!isNaN(minPrice)) {
          searchOptions.minPrice = minPrice;
        }
      }

      if (req.query.maxPrice) {
        const maxPrice = parseFloat(req.query.maxPrice as string);
        if (!isNaN(maxPrice)) {
          searchOptions.maxPrice = maxPrice;
        }
      }

      if (req.query.inStock !== undefined) {
        searchOptions.inStock = req.query.inStock === 'true';
      }

      if (req.query.tags) {
        const tags = Array.isArray(req.query.tags)
          ? (req.query.tags as string[])
          : [req.query.tags as string];
        searchOptions.tags = tags;
      }

      // Get products and total count
      const products = await productModel.search(searchOptions);
      const total = await productModel.count({
        query: searchOptions.query,
        category: searchOptions.category,
        minPrice: searchOptions.minPrice,
        maxPrice: searchOptions.maxPrice,
        inStock: searchOptions.inStock,
        tags: searchOptions.tags,
      });

      res.json(createPaginatedResponse(products, page, limit, total));
    } catch (error) {
      console.error('Error searching products:', error);
      res
        .status(500)
        .json(
          createErrorResponse(
            'SEARCH_PRODUCTS_ERROR',
            'Failed to search products'
          )
        );
    }
  }
);

// GET /api/products/categories - Get all product categories
router.get(
  '/categories',
  optionalAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const db = await getDatabase();
      const productModel = new Product(db);

      const categories = await productModel.getCategories();
      res.json(createSuccessResponse(categories));
    } catch (error) {
      console.error('Error fetching categories:', error);
      res
        .status(500)
        .json(
          createErrorResponse(
            'FETCH_CATEGORIES_ERROR',
            'Failed to fetch categories'
          )
        );
    }
  }
);

// GET /api/products/:id - Get product by ID
router.get(
  '/:id',
  optionalAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const db = await getDatabase();
      const productModel = new Product(db);

      const product = await productModel.findById(id);

      if (!product) {
        res
          .status(404)
          .json(createErrorResponse('PRODUCT_NOT_FOUND', 'Product not found'));
        return;
      }

      res.json(createSuccessResponse(product));
    } catch (error) {
      console.error('Error fetching product:', error);
      res
        .status(500)
        .json(
          createErrorResponse('FETCH_PRODUCT_ERROR', 'Failed to fetch product')
        );
    }
  }
);

// POST /api/products - Create new product
router.post(
  '/',
  authenticateToken,
  requireUserOrAdmin,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const productData: CreateProductInput = req.body;

      // Validate required fields
      if (
        !productData.name ||
        !productData.description ||
        productData.price === undefined ||
        !productData.category
      ) {
        res
          .status(400)
          .json(
            createErrorResponse(
              'VALIDATION_ERROR',
              'Name, description, price, and category are required'
            )
          );
        return;
      }

      // Validate price
      if (typeof productData.price !== 'number' || productData.price < 0) {
        res
          .status(400)
          .json(
            createErrorResponse(
              'VALIDATION_ERROR',
              'Price must be a non-negative number'
            )
          );
        return;
      }

      // Validate tags if provided
      if (productData.tags && !Array.isArray(productData.tags)) {
        res
          .status(400)
          .json(
            createErrorResponse('VALIDATION_ERROR', 'Tags must be an array')
          );
        return;
      }

      const db = await getDatabase();
      const productModel = new Product(db);

      // Create product
      const newProduct = await productModel.create(productData);
      res.status(201).json(createSuccessResponse(newProduct));
    } catch (error) {
      console.error('Error creating product:', error);
      res
        .status(500)
        .json(
          createErrorResponse(
            'CREATE_PRODUCT_ERROR',
            'Failed to create product'
          )
        );
    }
  }
);

// PUT /api/products/:id - Update product
router.put(
  '/:id',
  authenticateToken,
  requireUserOrAdmin,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: UpdateProductInput = req.body;

      // Validate price if provided
      if (updateData.price !== undefined) {
        if (typeof updateData.price !== 'number' || updateData.price < 0) {
          res
            .status(400)
            .json(
              createErrorResponse(
                'VALIDATION_ERROR',
                'Price must be a non-negative number'
              )
            );
          return;
        }
      }

      // Validate tags if provided
      if (updateData.tags && !Array.isArray(updateData.tags)) {
        res
          .status(400)
          .json(
            createErrorResponse('VALIDATION_ERROR', 'Tags must be an array')
          );
        return;
      }

      const db = await getDatabase();
      const productModel = new Product(db);

      const updatedProduct = await productModel.update(id, updateData);

      if (!updatedProduct) {
        res
          .status(404)
          .json(createErrorResponse('PRODUCT_NOT_FOUND', 'Product not found'));
        return;
      }

      res.json(createSuccessResponse(updatedProduct));
    } catch (error) {
      console.error('Error updating product:', error);
      res
        .status(500)
        .json(
          createErrorResponse(
            'UPDATE_PRODUCT_ERROR',
            'Failed to update product'
          )
        );
    }
  }
);

// DELETE /api/products/:id - Delete product
router.delete(
  '/:id',
  authenticateToken,
  requireUserOrAdmin,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const db = await getDatabase();
      const productModel = new Product(db);

      const deleted = await productModel.delete(id);

      if (!deleted) {
        res
          .status(404)
          .json(createErrorResponse('PRODUCT_NOT_FOUND', 'Product not found'));
        return;
      }

      res.json(
        createSuccessResponse({ message: 'Product deleted successfully' })
      );
    } catch (error) {
      console.error('Error deleting product:', error);
      res
        .status(500)
        .json(
          createErrorResponse(
            'DELETE_PRODUCT_ERROR',
            'Failed to delete product'
          )
        );
    }
  }
);

export default router;
