/**
 * PostgREST caps every response at its configured max-rows (1000 by default),
 * so `.limit(2000)` silently returns only 1000 rows. Any aggregate computed from
 * a capped fetch undercounts once the table grows past that cap.
 *
 * `fetchAllRows` walks the result set with `.range()` pages until a short page is
 * returned, so callers get the full set (up to `maxRows`) instead of a silent cap.
 */
const PAGE_SIZE = 1000;

export interface PageResult<T> {
  data: T[] | null;
  error: { message: string } | null;
}

export async function fetchAllRows<T>(
  queryPage: (from: number, to: number) => PromiseLike<PageResult<T>>,
  maxRows = 20000
): Promise<T[]> {
  const rows: T[] = [];

  for (let from = 0; from < maxRows; from += PAGE_SIZE) {
    const to = Math.min(from + PAGE_SIZE - 1, maxRows - 1);
    const { data, error } = await queryPage(from, to);
    if (error) throw new Error(error.message);

    const batch = data ?? [];
    rows.push(...batch);

    if (batch.length < to - from + 1) break;
  }

  return rows;
}
