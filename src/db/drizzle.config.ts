import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables from .env file.
dotenv.config();

let dbCredentials: any = {};

if (process.env.DATABASE_URL) {
  try {
    const parsed = new URL(process.env.DATABASE_URL);
    dbCredentials = {
      host: parsed.hostname || "localhost",
      port: parsed.port ? Number(parsed.port) : 5432,
      user: parsed.username ? decodeURIComponent(parsed.username) : "postgres",
      password: parsed.password ? decodeURIComponent(parsed.password) : "",
      database: (parsed.pathname && parsed.pathname.length > 1) ? decodeURIComponent(parsed.pathname.slice(1)) : "rebeldiafm",
      ssl: false,
    };
  } catch {
    dbCredentials = {
      url: process.env.DATABASE_URL,
      ssl: false,
    };
  }
} else {
  const sqlHost = process.env.SQL_HOST;
  const sqlDbName = process.env.SQL_DB_NAME;
  const user = process.env.SQL_ADMIN_USER || process.env.SQL_USER;
  const password = process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD;

  if (!sqlHost) {
    throw new Error("Neither DATABASE_URL nor SQL_HOST is set in environment variables.");
  }
  if (!sqlDbName) {
    throw new Error("Neither DATABASE_URL nor SQL_DB_NAME is set in environment variables.");
  }
  if (!user) {
    throw new Error("Neither DATABASE_URL nor SQL_ADMIN_USER is set in environment variables.");
  }
  if (!password) {
    throw new Error("Neither DATABASE_URL nor SQL_ADMIN_PASSWORD is set in environment variables.");
  }

  dbCredentials = {
    host: sqlHost,
    user: user,
    password: password,
    database: sqlDbName,
    ssl: false,
  };
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./server/migrations",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials,
  verbose: true,
});
