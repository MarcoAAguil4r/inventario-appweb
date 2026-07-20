import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';

const migrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');
const baselineOnly = process.argv.includes('--baseline');

async function ensureMigrationsTable(connection) {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getAppliedMigrations(connection) {
  const [rows] = await connection.execute('SELECT filename FROM schema_migrations');
  return new Set(rows.map((row) => row.filename));
}

async function markMigration(connection, filename) {
  await connection.execute('INSERT IGNORE INTO schema_migrations (filename) VALUES (?)', [filename]);
}

async function run() {
  const connection = await pool.getConnection();

  try {
    await ensureMigrationsTable(connection);
    const applied = await getAppliedMigrations(connection);
    const files = (await fs.readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort();

    for (const file of files) {
      if (applied.has(file)) continue;

      if (baselineOnly) {
        await markMigration(connection, file);
        console.log(`Baselined ${file}`);
        continue;
      }

      const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
      const statements = sql
        .split(';')
        .map((statement) => statement.trim())
        .filter(Boolean);

      for (const statement of statements) {
        await connection.query(statement);
      }

      await markMigration(connection, file);
      console.log(`Applied ${file}`);
    }
  } finally {
    connection.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error('[Migration error]', error.message);
  process.exitCode = 1;
});
