import { PGlite } from '@electric-sql/pglite';
import { Pool } from 'pg';
import { randomBytes } from 'node:crypto';
import { migrate, PostgresRepository } from '../../repositories/postgres.mjs';

export async function testDatabase() {
  if (process.env.TEST_DATABASE_URL) {
    const admin = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
    const schema = 'test_' + randomBytes(12).toString('hex');
    await admin.query(`CREATE SCHEMA "${schema}"`);
    const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 5, options: `-c search_path=${schema},public` });
    const end = pool.end.bind(pool);
    pool.end = async () => { await end(); await admin.query(`DROP SCHEMA "${schema}" CASCADE`); await admin.end(); };
    await migrate(pool);
    const repository = new PostgresRepository({}, { pool, listen: false }); await repository.init();
    return { repository, pool };
  }
  const db = new PGlite();
  // PGlite executes real PostgreSQL SQL in-process. Only driver transport, multi-statement
  // dispatch, and pooling are adapted; production tests also run on PostgreSQL in CI.
  const pool = {
    async query(sql, values) {
      if (!values?.length && sql.includes(';')) { const results = await db.exec(sql); return results.at(-1) || { rows: [] }; }
      return db.query(sql, values);
    },
    async connect() { return { query: (sql, values) => pool.query(sql, values), release() {} }; },
    async end() { await db.close(); },
  };
  await migrate(pool);
  const repository = new PostgresRepository({}, { pool, listen: false }); await repository.init();
  return { repository, pool };
}
