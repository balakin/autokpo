import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './worker/db/migrations',
  schema: './worker/db/schema',
  dialect: 'sqlite',
});
