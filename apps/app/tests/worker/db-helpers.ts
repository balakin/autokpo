import { readD1Migrations } from '@cloudflare/vitest-pool-workers';
import { applyD1Migrations } from 'cloudflare:test';

export async function applyMigrations(db: D1Database): Promise<void> {
  const migrations = await readD1Migrations('./worker/db/migrations');
  await applyD1Migrations(db, migrations);
}
