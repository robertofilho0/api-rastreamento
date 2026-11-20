/** Cache em memória com expiração por item e limite de tamanho (remove o mais antigo). */
class TtlCache {
  constructor({ ttlMs, maxSize = 1000 }) {
    this.ttlMs = ttlMs;
    this.maxSize = maxSize;
    this.store = new Map();
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return undefined;
    if (item.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return item.value;
  }

  set(key, value) {
    if (this.ttlMs <= 0) return;
    if (this.store.size >= this.maxSize) {
      this.store.delete(this.store.keys().next().value);
    }
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  clear() {
    this.store.clear();
  }

  get size() {
    return this.store.size;
  }
}

module.exports = TtlCache;
