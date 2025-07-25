var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { v4 as uuidv4 } from 'uuid';
export class Product {
    constructor(db) {
        this.db = db;
    }
    create(productData) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = uuidv4();
            const now = new Date().toISOString();
            const tags = JSON.stringify(productData.tags || []);
            yield this.db.run(`
      INSERT INTO products (
        id, name, description, price, category, in_stock, image_url, tags, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
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
            ]);
            const product = yield this.findById(id);
            if (!product) {
                throw new Error('Failed to create product');
            }
            return product;
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const row = yield this.db.get('SELECT * FROM products WHERE id = ?', [id]);
            return row ? this.mapRowToProduct(row) : null;
        });
    }
    findAll(limit, offset) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = 'SELECT * FROM products ORDER BY created_at DESC';
            const params = [];
            if (limit) {
                query += ' LIMIT ?';
                params.push(limit);
                if (offset) {
                    query += ' OFFSET ?';
                    params.push(offset);
                }
            }
            const rows = yield this.db.all(query, params);
            return rows.map((row) => this.mapRowToProduct(row));
        });
    }
    search(options) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = 'SELECT * FROM products WHERE 1=1';
            const params = [];
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
            const rows = yield this.db.all(query, params);
            return rows.map((row) => this.mapRowToProduct(row));
        });
    }
    update(id, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingProduct = yield this.findById(id);
            if (!existingProduct) {
                return null;
            }
            const updates = [];
            const params = [];
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
            yield this.db.run(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, params);
            return yield this.findById(id);
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.db.run('DELETE FROM products WHERE id = ?', [id]);
            return (result.changes || 0) > 0;
        });
    }
    count(options) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = 'SELECT COUNT(*) as count FROM products WHERE 1=1';
            const params = [];
            if (options === null || options === void 0 ? void 0 : options.query) {
                query += ' AND (name LIKE ? OR description LIKE ?)';
                const searchTerm = `%${options.query}%`;
                params.push(searchTerm, searchTerm);
            }
            if (options === null || options === void 0 ? void 0 : options.category) {
                query += ' AND category = ?';
                params.push(options.category);
            }
            if ((options === null || options === void 0 ? void 0 : options.minPrice) !== undefined) {
                query += ' AND price >= ?';
                params.push(options.minPrice);
            }
            if ((options === null || options === void 0 ? void 0 : options.maxPrice) !== undefined) {
                query += ' AND price <= ?';
                params.push(options.maxPrice);
            }
            if ((options === null || options === void 0 ? void 0 : options.inStock) !== undefined) {
                query += ' AND in_stock = ?';
                params.push(options.inStock ? 1 : 0);
            }
            if ((options === null || options === void 0 ? void 0 : options.tags) && options.tags.length > 0) {
                const tagConditions = options.tags.map(() => 'tags LIKE ?').join(' OR ');
                query += ` AND (${tagConditions})`;
                options.tags.forEach((tag) => {
                    params.push(`%"${tag}"%`);
                });
            }
            const result = yield this.db.get(query, params);
            return (result === null || result === void 0 ? void 0 : result.count) || 0;
        });
    }
    getCategories() {
        return __awaiter(this, void 0, void 0, function* () {
            const rows = yield this.db.all('SELECT DISTINCT category FROM products ORDER BY category');
            return rows.map((row) => row.category);
        });
    }
    mapRowToProduct(row) {
        let tags = [];
        if (row.tags) {
            try {
                tags = JSON.parse(row.tags);
            }
            catch (error) {
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
