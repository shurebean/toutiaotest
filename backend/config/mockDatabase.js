// 模拟数据库存储（用于无MongoDB环境）
class MockDatabase {
  constructor() {
    this.collections = {
      news: []
    };
  }

  collection(name) {
    if (!this.collections[name]) {
      this.collections[name] = [];
    }
    
    return {
      find: (query = {}, options = {}) => {
        let data = this.collections[name];
        
        // 简单的查询过滤
        if (query.category) {
          data = data.filter(item => item.category === query.category);
        }
        
        if (query.url) {
          data = data.filter(item => item.url === query.url);
        }
        
        if (query._id) {
          data = data.filter(item => item._id.toString() === query._id.toString());
        }
        
        // 排序
        if (options.sort) {
          const sortKeys = Object.keys(options.sort);
          sortKeys.forEach(key => {
            data.sort((a, b) => {
              if (options.sort[key] === 1) {
                return a[key] > b[key] ? 1 : -1;
              } else {
                return a[key] < b[key] ? 1 : -1;
              }
            });
          });
        }
        
        // 限制
        if (options.limit) {
          data = data.slice(0, options.limit);
        }
        
        // 跳过
        if (options.skip) {
          data = data.slice(options.skip);
        }
        
        return {
          toArray: async () => data,
          limit: (num) => ({
            toArray: async () => data.slice(0, num)
          }),
          skip: (num) => ({
            toArray: async () => data.slice(num)
          }),
          sort: (sort) => ({
            toArray: async () => {
              const sortKeys = Object.keys(sort);
              sortKeys.forEach(key => {
                data.sort((a, b) => {
                  if (sort[key] === 1) {
                    return a[key] > b[key] ? 1 : -1;
                  } else {
                    return a[key] < b[key] ? 1 : -1;
                  }
                });
              });
              return data;
            }
          })
        };
      },
      
      findOne: async (query) => {
        const data = this.collections[name];
        return data.find(item => {
          if (query.url && item.url === query.url) return true;
          if (query._id && item._id.toString() === query._id.toString()) return true;
          return false;
        });
      },
      
      insertOne: async (doc) => {
        doc._id = { toString: () => Math.random().toString(36).substr(2, 9) };
        this.collections[name].push(doc);
        return { insertedId: doc._id };
      },
      
      insertMany: async (docs) => {
        const result = [];
        for (const doc of docs) {
          doc._id = { toString: () => Math.random().toString(36).substr(2, 9) };
          this.collections[name].push(doc);
          result.push(doc._id);
        }
        return { insertedIds: result };
      },
      
      updateOne: async (query, update) => {
        const data = this.collections[name];
        const item = data.find(item => {
          if (query._id && item._id.toString() === query._id.toString()) return true;
          return false;
        });
        
        if (item && update.$set) {
          Object.assign(item, update.$set);
        }
        
        return { modifiedCount: item ? 1 : 0 };
      },
      
      countDocuments: async (query) => {
        return this.collections[name].length;
      },
      
      createIndex: async (indexSpec, options) => {
        console.log(`📊 模拟数据库: 创建索引 ${JSON.stringify(indexSpec)}`);
        return true;
      }
    };
  }
}

module.exports = MockDatabase;