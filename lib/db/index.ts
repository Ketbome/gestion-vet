import "server-only";

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { sql } from "drizzle-orm";
import * as schema from "./schema";
import { seed } from "./seed";
import { hashPassword } from "../password";

type DB = BetterSQLite3Database<typeof schema>;

function createDb(): DB {
  const dbPath = process.env.DATABASE_PATH ?? "./data/gestionvet.db";
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  const db = drizzle(sqlite, { schema });

  // Durante `next build` varios workers importan este módulo en paralelo y
  // no se ejecuta ninguna query (las páginas con BD son dinámicas): migrar
  // aquí provocaría una carrera entre procesos. Se migra solo en runtime.
  if (process.env.NEXT_PHASE !== "phase-production-build") {
    migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });

    const [{ count }] = db
      .all<{ count: number }>(sql`select count(*) as count from services`);
    if (count === 0) {
      seed(db);
    }

    // Bootstrap: si no hay usuarios, crear el admin desde las variables de
    // entorno para que el login funcione sin configuración previa.
    const [{ userCount }] = db.all<{ userCount: number }>(
      sql`select count(*) as userCount from users`
    );
    if (userCount === 0) {
      const username = process.env.AUTH_USER ?? "admin";
      const { hash, salt } = hashPassword(process.env.AUTH_PASSWORD ?? "admin");
      db.run(
        sql`insert into users (username, name, role, password_hash, password_salt)
            values (${username}, ${"Administrador"}, ${"admin"}, ${hash}, ${salt})`
      );
    }
  }

  return db;
}

// Cachear en globalThis para sobrevivir al HMR en desarrollo
const globalForDb = globalThis as unknown as { __gestionvetDb?: DB };

export const db: DB = globalForDb.__gestionvetDb ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__gestionvetDb = db;
}

export * from "./schema";
