const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');

class SQLiteAdapter {
  constructor(dbPath = './data/news.db') {
    this.db = new Database(dbPath);
    this.collections = {};
    this.initDatabase();
  }

  initDatabase() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS news (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        url TEXT NOT NULL UNIQUE,
        category TEXT,
        summary TEXT,
        createdAt INTEGER
      )
    `);
    console.log('✅ SQLite数据库初始化成功');
  }

  collection(name) {
    if (!this.collections[name]) {
      this.collections[name] = new Collection(this.db, name);
    }
    return this.collections[name];
  }

  close() {
    this.db.close();
  }
}

class Collection {
  constructor(db, name) {
    this.db = db;
    this.name = name;
  }

  async find(query = {}, options = {}) {
    let sql = 'SELECT * FROM ' + this.name;
    const params = [];
    const conditions = [];

    if (query.category) {
      conditions.push('category = ?');
      params.push(query.category);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    if (options.sort) {
      const sortKeys = Object.keys(options.sort);
      const orderClauses = sortKeys.map(key => {
        const direction = options.sort[key] === 1 ? 'ASC' : 'DESC';
        return key + ' ' + direction;
      });
      sql += ' ORDER BY ' + orderClauses.join(', ');
    }

    if (options.skip) {
      sql += ' OFFSET ' + options.skip;
    }

    if (options.limit) {
      sql += ' LIMIT ' + options.limit;
    }

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params);
    return rows.map(row => this._rowToDoc(row));
  }

  async findOne(query) {
    const results = await this.find(query, { limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  async insertOne(doc) {
    const id = doc.id || uuidv4();
    const now = Date.now();

    const sql = `INSERT INTO ${this.name} (id, title, url, category, summary, createdAt) VALUES (?, ?, ?, ?, ?, ?)`;
    
    const stmt = this.db.prepare(sql);
    stmt.run(
      id,
      doc.title,
      doc.url,
      doc.category || null,
      doc.summary || null,
      now
    );

    return { insertedId: { toString: () => id } };
  }

  async insertMany(docs) {
    const results = [];
    for (const doc of docs) {
      try {
        const result = await this.insertOne(doc);
        results.push(result.insertedId);
      } catch (error) {
        if (error.code !== 'SQLITE_CONSTRAINT') {
          console.error('插入失败:', error);
        }
      }
    }
    return { insertedIds: results };
  }

  async updateOne(query, update) {
    const conditions = [];
    const params = [];

    if (query._id) {
      conditions.push('id = ?');
      params.push(query._id.toString());
    }

    if (conditions.length === 0) {
      return { modifiedCount: 0 };
    }

    const setClauses = [];
    const setParams = [];

    if (update.$set) {
      Object.keys(update.$set).forEach(key => {
        setClauses.push(key + ' = ?');
        const value = update.$set[key];
        if (value instanceof Date) {
          setParams.push(value.getTime());
        } else {
          setParams.push(value);
        }
      });
      setClauses.push('updatedAt = ?');
      setParams.push(Date.now());
    }

    if (setClauses.length === 0) {
      return { modifiedCount: 0 };
    }

    const sql = `UPDATE ${this.name} SET ${setClauses.join(', ')} WHERE ${conditions.join(' AND ')}`;
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...setParams, ...params);
    return { modifiedCount: result.changes };
  }

  async countDocuments(query) {
    const results = await this.find(query);
    return results.length;
  }

  async createIndex(indexSpec, options) {
    console.log(`📊 创建索引: ${JSON.stringify(indexSpec)}`);
    return true;
  }

  _rowToDoc(row) {
    return {
      _id: { toString: () => row.id },
      id: row.id,
      title: row.title,
      url: row.url,
      category: row.category,
      summary: row.summary,
      createdAt: row.createdAt ? new Date(row.createdAt) : null,
      updatedAt: row.createdAt ? new Date(row.createdAt) : null
    };
  }
}

module.exports = SQLiteAdapter;
