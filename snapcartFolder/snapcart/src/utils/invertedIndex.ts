// Inverted Index for Product Recommendations
interface Product {
    _id: string;
    name: string;
    category: string;
    price: string;
    unit: string;
    image: string;
  }
  
  interface InvertedIndex {
    [term: string]: Set<string>;
  }
  
  export class ProductInvertedIndex {
    private index: InvertedIndex = {};
    private productMap: Map<string, Product> = new Map();
    private categoryIndex: Map<string, Set<string>> = new Map();
  
    private tokenize(text: string): string[] {
      return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(term => term.length > 2);
    }
  
    buildIndex(products: Product[]) {
      this.index = {};
      this.productMap.clear();
      this.categoryIndex.clear();
  
      products.forEach(product => {
        this.productMap.set(product._id, product);
  
        const categoryKey = product.category.toLowerCase();
        if (!this.categoryIndex.has(categoryKey)) {
          this.categoryIndex.set(categoryKey, new Set());
        }
        this.categoryIndex.get(categoryKey)?.add(product._id);
  
        const searchableText = [
          product.name,
          product.category,
          product.unit
        ].join(' ');
  
        const tokens = this.tokenize(searchableText);
        
        tokens.forEach(token => {
          if (!this.index[token]) {
            this.index[token] = new Set();
          }
          this.index[token].add(product._id);
        });
      });
    }
  
    getProductsByCategory(category: string): Product[] {
      const categoryKey = category.toLowerCase();
      const productIds = this.categoryIndex.get(categoryKey) || new Set();
      
      return Array.from(productIds)
        .map(id => this.productMap.get(id))
        .filter((p): p is Product => p !== undefined);
    }
  
    search(query: string, limit: number = 20): Product[] {
      const tokens = this.tokenize(query);
      const scores: Map<string, number> = new Map();
  
      tokens.forEach(token => {
        const matchingProducts = this.index[token] || new Set();
        matchingProducts.forEach(productId => {
          scores.set(productId, (scores.get(productId) || 0) + 1);
        });
      });
  
      return Array.from(scores.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => this.productMap.get(id))
        .filter((p): p is Product => p !== undefined);
    }
  
    getRecommendations(productId: string, limit: number = 6): Product[] {
      const product = this.productMap.get(productId);
      if (!product) return [];
  
      const scores: Map<string, number> = new Map();
  
      const categoryProducts = this.getProductsByCategory(product.category);
      categoryProducts.forEach(p => {
        if (p._id !== productId) {
          scores.set(p._id, (scores.get(p._id) || 0) + 5);
        }
      });
  
      const tokens = this.tokenize(product.name);
      tokens.forEach(token => {
        const matchingProducts = this.index[token] || new Set();
        matchingProducts.forEach(pid => {
          if (pid !== productId) {
            scores.set(pid, (scores.get(pid) || 0) + 1);
          }
        });
      });
  
      return Array.from(scores.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => this.productMap.get(id))
        .filter((p): p is Product => p !== undefined);
    }
  
    getAllProducts(): Product[] {
      return Array.from(this.productMap.values());
    }
  }
  
  let indexInstance: ProductInvertedIndex | null = null;
  
  export function getProductIndex(): ProductInvertedIndex {
    if (!indexInstance) {
      indexInstance = new ProductInvertedIndex();
    }
    return indexInstance;
  }