import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL ?? '';

export const pool = new Pool({
  connectionString,
  ssl: process.env.PGSSL?.toLowerCase() === 'true' ? { rejectUnauthorized: false } : undefined,
});

import type { QueryResult, QueryResultRow } from 'pg';

export async function q<T extends QueryResultRow = QueryResultRow>(text: string, params?: any[]): Promise<QueryResult<T>> {
  console.log('[DB] query', { text, paramsCount: params?.length ?? 0 });
  const res = await pool.query<T>(text, params);
  return res;
}
