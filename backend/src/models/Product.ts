import { Database } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

export interface ProductData {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  inStock: boolean;
  imageUrl?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  category: string;
  inStock?: boolean;
  imageUrl?: string;
  tags?: string[];
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  inStock?: boolean;
  imageUrl?: string;
  tags?: string[];
}

export interface ProductSearchOptions {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  tags?: string[];
  limit?: number;
  offset?: number;
}

interface ProductRow {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  in_stock: number;
  image_url: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string;
}

export class Product {
  constructor(private db: Database) {}

  async create(productData: CreateProductInput): Promise<ProductData> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const tags = JSON.stringify(productData.tags || []);

    await this.db.run(
      `
      INSERT INTO products (
        id, name, description, price, category, in_stock, image_url, tags, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        id,
        productData.name,
        productData.description,
        productData.price,
        productData.category,
        productData.inStock !== false ? 1 : 0,
        productData.imageUrl || null,
        tags,
        now,
        now,
      ]
    );

    const product = await this.findById(id);
    if (!product) {
      throw new Error('Failed to create product');
    }

    return product;
  }

  async findById(id: string): Promise<ProductData | null> {
    const row = await this.db.get<ProductRow>(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );
    return row ? this.mapRowToProduct(row) : null;
  }

  async findAll(limit?: number, offset?: number): Promise<ProductData[]> {
    let query = 'SELECT * FROM products ORDER BY created_at DESC';
    const params: any[] = [];

    if (limit) {
      query += ' LIMIT ?';
      params.push(limit);

      if (offset) {
        query += ' OFFSET ?';
        params.push(offset);
      }
    }

    const rows = await this.db.all<ProductRow>(query, params);
    return rows.map((row) => this.mapRowToProduct(row));
  }

  async search(options: ProductSearchOptions): Promise<ProductData[]> {
    let query = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];

    if (options.query) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      const searchTerm = `%${options.query}%`;
      params.push(searchTerm, searchTerm);
    }

    if (options.category) {
      query += ' AND category = ?';
      params.push(options.category);
    }

    if (options.minPrice !== undefined) {
      query += ' AND price >= ?';
      params.push(options.minPrice);
    }

    if (options.maxPrice !== undefined) {
      query += ' AND price <= ?';
      params.push(options.maxPrice);
    }

    if (options.inStock !== undefined) {
      query += ' AND in_stock = ?';
      params.push(options.inStock ? 1 : 0);
    }

    if (options.tags && options.tags.length > 0) {
      const tagConditions = options.tags.map(() => 'tags LIKE ?').join(' OR ');
      query += ` AND (${tagConditions})`;
      options.tags.forEach((tag) => {
        params.push(`%"${tag}"%`);
      });
    }

    query += ' ORDER BY created_at DESC';

    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);

      if (options.offset) {
        query += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    const rows = await this.db.all<ProductRow>(query, params);
    return rows.map((row) => this.mapRowToProduct(row));
  }

  async update(
    id: string,
    updateData: UpdateProductInput
  ): Promise<ProductData | null> {
    const existingProduct = await this.findById(id);
    if (!existingProduct) {
      return null;
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (updateData.name !== undefined) {
      updates.push('name = ?');
      params.push(updateData.name);
    }

    if (updateData.description !== undefined) {
      updates.push('description = ?');
      params.push(updateData.description);
    }

    if (updateData.price !== undefined) {
      updates.push('price = ?');
      params.push(updateData.price);
    }

    if (updateData.category !== undefined) {
      updates.push('category = ?');
      params.push(updateData.category);
    }

    if (updateData.inStock !== undefined) {
      updates.push('in_stock = ?');
      params.push(updateData.inStock ? 1 : 0);
    }

    if (updateData.imageUrl !== undefined) {
      updates.push('image_url = ?');
      params.push(updateData.imageUrl);
    }

    if (updateData.tags !== undefined) {
      updates.push('tags = ?');
      params.push(JSON.stringify(updateData.tags));
    }

    if (updates.length === 0) {
      return existingProduct;
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    await this.db.run(
      `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.run('DELETE FROM products WHERE id = ?', [id]);
    return (result.changes || 0) > 0;
  }

  async count(
    options?: Omit<ProductSearchOptions, 'limit' | 'offset'>
  ): Promise<number> {
    let query = 'SELECT COUNT(*) as count FROM products WHERE 1=1';
    const params: any[] = [];

    if (options?.query) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      const searchTerm = `%${options.query}%`;
      params.push(searchTerm, searchTerm);
    }

    if (options?.category) {
      query += ' AND category = ?';
      params.push(options.category);
    }

    if (options?.minPrice !== undefined) {
      query += ' AND price >= ?';
      params.push(options.minPrice);
    }

    if (options?.maxPrice !== undefined) {
      query += ' AND price <= ?';
      params.push(options.maxPrice);
    }

    if (options?.inStock !== undefined) {
      query += ' AND in_stock = ?';
      params.push(options.inStock ? 1 : 0);
    }

    if (options?.tags && options.tags.length > 0) {
      const tagConditions = options.tags.map(() => 'tags LIKE ?').join(' OR ');
      query += ` AND (${tagConditions})`;
      options.tags.forEach((tag) => {
        params.push(`%"${tag}"%`);
      });
    }

    const result = await this.db.get<{ count: number }>(query, params);
    return result?.count || 0;
  }

  async getCategories(): Promise<string[]> {
    const rows = await this.db.all<{ category: string }>(
      'SELECT DISTINCT category FROM products ORDER BY category'
    );
    return rows.map((row) => row.category);
  }

  private mapRowToProduct(row: ProductRow): ProductData {
    let tags: string[] = [];
    if (row.tags) {
      try {
        tags = JSON.parse(row.tags);
      } catch (error) {
        console.warn('Failed to parse product tags:', error);
        tags = [];
      }
    }

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      category: row.category,
      inStock: row.in_stock === 1,
      imageUrl: row.image_url || undefined,
      tags,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
