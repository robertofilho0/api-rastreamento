/** Cache em memória com expiração por item e limite de tamanho (remove o mais antigo). */
export class TtlCache<T> {
  private readonly store = new Map<string, { value: T; expiresAt: number }>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxSize = 1000,
  ) {}

  get(key: string): T | undefined {
    const item = this.store.get(key);
    if (!item) return undefined;
    if (item.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return item.value;
  }

  set(key: string, value: T): void {
    if (this.ttlMs <= 0) return;
    if (this.store.size >= this.maxSize)
      this.store.delete(this.store.keys().next().value!);
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  clear(): void {
    this.store.clear();
  }
}
