import { getModels } from '../../database/init';
import {
  CreateProductInput,
  UpdateProductInput,
  ProductSearchOptions,
} from '../../models/Product';

describe('Product Model', () => {
  let productModel: ReturnType<typeof getModels>['product'];

  beforeEach(() => {
    const models = getModels();
    productModel = models.product;
  });

  describe('create', () => {
    it('should create a new product with valid data', async () => {
      const productData: CreateProductInput = {
        name: 'Test Product',
        description: 'A test product',
        price: 29.99,
        category: 'Electronics',
        inStock: true,
        imageUrl: 'https://example.com/image.jpg',
        tags: ['test', 'electronics'],
      };

      const product = await productModel.create(productData);

      expect(product.id).toBeDefined();
      expect(product.name).toBe(productData.name);
      expect(product.description).toBe(productData.description);
      expect(product.price).toBe(productData.price);
      expect(product.category).toBe(productData.category);
      expect(product.inStock).toBe(productData.inStock);
      expect(product.imageUrl).toBe(productData.imageUrl);
      expect(product.tags).toEqual(productData.tags);
      expect(product.createdAt).toBeInstanceOf(Date);
      expect(product.updatedAt).toBeInstanceOf(Date);
    });

    it('should create product with default values', async () => {
      const productData: CreateProductInput = {
        name: 'Simple Product',
        description: 'Simple description',
        price: 19.99,
        category: 'Books',
      };

      const product = await productModel.create(productData);

      expect(product.inStock).toBe(true); // Default value
      expect(product.imageUrl).toBeUndefined();
      expect(product.tags).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should find product by id', async () => {
      const productData: CreateProductInput = {
        name: 'Find Test Product',
        description: 'Test description',
        price: 15.99,
        category: 'Test',
      };

      const createdProduct = await productModel.create(productData);
      const foundProduct = await productModel.findById(createdProduct.id);

      expect(foundProduct).not.toBeNull();
      expect(foundProduct!.id).toBe(createdProduct.id);
      expect(foundProduct!.name).toBe(productData.name);
    });

    it('should return null for non-existent id', async () => {
      const foundProduct = await productModel.findById('non-existent-id');
      expect(foundProduct).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      const products = [
        {
          name: 'Product 1',
          description: 'Desc 1',
          price: 10,
          category: 'Cat1',
        },
        {
          name: 'Product 2',
          description: 'Desc 2',
          price: 20,
          category: 'Cat2',
        },
        {
          name: 'Product 3',
          description: 'Desc 3',
          price: 30,
          category: 'Cat3',
        },
      ];

      for (const productData of products) {
        await productModel.create(productData);
      }

      const allProducts = await productModel.findAll();
      expect(allProducts).toHaveLength(3);
    });

    it('should support pagination', async () => {
      const products = [
        {
          name: 'Product 1',
          description: 'Desc 1',
          price: 10,
          category: 'Cat1',
        },
        {
          name: 'Product 2',
          description: 'Desc 2',
          price: 20,
          category: 'Cat2',
        },
        {
          name: 'Product 3',
          description: 'Desc 3',
          price: 30,
          category: 'Cat3',
        },
      ];

      for (const productData of products) {
        await productModel.create(productData);
      }

      const firstPage = await productModel.findAll(2, 0);
      const secondPage = await productModel.findAll(2, 2);

      expect(firstPage).toHaveLength(2);
      expect(secondPage).toHaveLength(1);
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      const products = [
        {
          name: 'iPhone 13',
          description: 'Apple smartphone',
          price: 999,
          category: 'Electronics',
          tags: ['apple', 'phone'],
        },
        {
          name: 'Samsung Galaxy',
          description: 'Android smartphone',
          price: 799,
          category: 'Electronics',
          tags: ['samsung', 'phone'],
        },
        {
          name: 'MacBook Pro',
          description: 'Apple laptop',
          price: 1999,
          category: 'Computers',
          tags: ['apple', 'laptop'],
        },
        {
          name: 'Dell XPS',
          description: 'Windows laptop',
          price: 1299,
          category: 'Computers',
          tags: ['dell', 'laptop'],
        },
      ];

      for (const productData of products) {
        await productModel.create(productData);
      }
    });

    it('should search by query in name and description', async () => {
      const results = await productModel.search({ query: 'Apple' });
      expect(results).toHaveLength(2);
      expect(
        results.every(
          (p) =>
            p.name.includes('iPhone') ||
            p.name.includes('MacBook') ||
            p.description.includes('Apple')
        )
      ).toBe(true);
    });

    it('should search by category', async () => {
      const results = await productModel.search({ category: 'Electronics' });
      expect(results).toHaveLength(2);
      expect(results.every((p) => p.category === 'Electronics')).toBe(true);
    });

    it('should search by price range', async () => {
      const results = await productModel.search({
        minPrice: 800,
        maxPrice: 1500,
      });
      expect(results).toHaveLength(2);
      expect(results.every((p) => p.price >= 800 && p.price <= 1500)).toBe(
        true
      );
    });

    it('should search by tags', async () => {
      const results = await productModel.search({ tags: ['apple'] });
      expect(results).toHaveLength(2);
      expect(results.every((p) => p.tags.includes('apple'))).toBe(true);
    });

    it('should combine multiple search criteria', async () => {
      const results = await productModel.search({
        category: 'Electronics',
        maxPrice: 900,
        tags: ['samsung'],
      });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Samsung Galaxy');
    });

    it('should support pagination in search', async () => {
      const results = await productModel.search({ limit: 2, offset: 0 });
      expect(results).toHaveLength(2);

      const nextResults = await productModel.search({ limit: 2, offset: 2 });
      expect(nextResults).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('should update product data', async () => {
      const productData: CreateProductInput = {
        name: 'Update Test',
        description: 'Original description',
        price: 100,
        category: 'Original',
      };

      const product = await productModel.create(productData);

      const updateData: UpdateProductInput = {
        name: 'Updated Product',
        price: 150,
        tags: ['updated', 'test'],
      };

      const updatedProduct = await productModel.update(product.id, updateData);

      expect(updatedProduct).not.toBeNull();
      expect(updatedProduct!.name).toBe(updateData.name);
      expect(updatedProduct!.price).toBe(updateData.price);
      expect(updatedProduct!.tags).toEqual(updateData.tags);
      expect(updatedProduct!.description).toBe(productData.description); // Should remain unchanged
    });

    it('should return null for non-existent product', async () => {
      const updateData: UpdateProductInput = {
        name: 'New Name',
      };

      const result = await productModel.update('non-existent-id', updateData);
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete product', async () => {
      const productData: CreateProductInput = {
        name: 'Delete Test',
        description: 'To be deleted',
        price: 50,
        category: 'Test',
      };

      const product = await productModel.create(productData);
      const deleted = await productModel.delete(product.id);

      expect(deleted).toBe(true);

      const foundProduct = await productModel.findById(product.id);
      expect(foundProduct).toBeNull();
    });

    it('should return false for non-existent product', async () => {
      const deleted = await productModel.delete('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('count', () => {
    it('should return correct product count', async () => {
      expect(await productModel.count()).toBe(0);

      await productModel.create({
        name: 'Count Test 1',
        description: 'Test',
        price: 10,
        category: 'Test',
      });

      expect(await productModel.count()).toBe(1);

      await productModel.create({
        name: 'Count Test 2',
        description: 'Test',
        price: 20,
        category: 'Test',
      });

      expect(await productModel.count()).toBe(2);
    });

    it('should count with search options', async () => {
      await productModel.create({
        name: 'Electronics Product',
        description: 'Test',
        price: 100,
        category: 'Electronics',
      });

      await productModel.create({
        name: 'Books Product',
        description: 'Test',
        price: 20,
        category: 'Books',
      });

      const electronicsCount = await productModel.count({
        category: 'Electronics',
      });
      expect(electronicsCount).toBe(1);

      const expensiveCount = await productModel.count({ minPrice: 50 });
      expect(expensiveCount).toBe(1);
    });
  });

  describe('getCategories', () => {
    it('should return unique categories', async () => {
      const products = [
        {
          name: 'Product 1',
          description: 'Test',
          price: 10,
          category: 'Electronics',
        },
        {
          name: 'Product 2',
          description: 'Test',
          price: 20,
          category: 'Books',
        },
        {
          name: 'Product 3',
          description: 'Test',
          price: 30,
          category: 'Electronics',
        },
        {
          name: 'Product 4',
          description: 'Test',
          price: 40,
          category: 'Clothing',
        },
      ];

      for (const productData of products) {
        await productModel.create(productData);
      }

      const categories = await productModel.getCategories();
      expect(categories).toHaveLength(3);
      expect(categories).toContain('Electronics');
      expect(categories).toContain('Books');
      expect(categories).toContain('Clothing');
      expect(categories).toEqual(categories.sort()); // Should be sorted
    });
  });
});
