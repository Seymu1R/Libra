import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

/** Fresh SQLite file with all migrations applied. */
export function createTestDb(): { db: PrismaClient; cleanup: () => Promise<void> } {
  const dir = mkdtempSync(path.join(tmpdir(), "terezi-test-"));
  const file = path.join(dir, "test.db");
  const sqlite = new Database(file);
  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
  for (const m of readdirSync(migrationsDir).filter((d) => !d.endsWith(".toml")).sort()) {
    sqlite.exec(readFileSync(path.join(migrationsDir, m, "migration.sql"), "utf8"));
  }
  sqlite.close();
  const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: `file:${file}` }) });
  return {
    db,
    cleanup: async () => {
      await db.$disconnect();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
