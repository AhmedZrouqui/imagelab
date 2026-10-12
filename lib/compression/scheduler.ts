export async function runWithConcurrency<T, R>(items: T[], worker: (item: T, index: number) => Promise<R>, limit = 2): Promise<R[]> {
  const results = new Array<R>(items.length); let cursor = 0;
  async function run() { while (cursor < items.length) { const index = cursor++; results[index] = await worker(items[index], index); } }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run)); return results;
}
