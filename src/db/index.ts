import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const isDatabaseConfigured = (): boolean => {
  return Boolean(
    process.env.DATABASE_URL ||
    (process.env.SQL_HOST && process.env.SQL_USER && process.env.SQL_DB_NAME)
  );
};

export const getDbConfig = () => {
  let host = process.env.SQL_HOST;
  let port: number | undefined = undefined;
  let user = process.env.SQL_USER;
  let password = process.env.SQL_PASSWORD;
  let database = process.env.SQL_DB_NAME;

  if (process.env.DATABASE_URL) {
    try {
      const parsed = new URL(process.env.DATABASE_URL);
      if (parsed.hostname) host = parsed.hostname;
      if (parsed.port) port = Number(parsed.port);
      if (parsed.username) user = decodeURIComponent(parsed.username);
      if (parsed.password) password = decodeURIComponent(parsed.password);
      if (parsed.pathname && parsed.pathname.length > 1) {
        database = decodeURIComponent(parsed.pathname.slice(1));
      }
    } catch {
      // Ignore URL parse error and fall back to raw connectionString
    }
  }

  return { host, port, user, password, database };
};

export const createPool = () => {
  if (!global._postgresPool) {
    const { host, port, user, password, database } = getDbConfig();

    const poolConfig: any = {
      max: 10,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 15000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    };

    if (host) poolConfig.host = host;
    if (port) poolConfig.port = port;
    if (user) poolConfig.user = user;
    if (password) poolConfig.password = password;
    if (database) poolConfig.database = database;

    if (!host && process.env.DATABASE_URL) {
      poolConfig.connectionString = process.env.DATABASE_URL;
    }

    global._postgresPool = new Pool(poolConfig);

    global._postgresPool.on('error', (err: any) => {
      const message = String(err?.message || err || '');
      const code = String(err?.code || '');
      const isExpectedIdleDrop =
        message.includes('Connection terminated unexpectedly') ||
        message.includes('Connection terminated') ||
        code === 'ECONNRESET' ||
        code === 'ETIMEDOUT' ||
        code === '57P01';
      if (isExpectedIdleDrop) {
        console.log('[DB Pool] Conexão ociosa reciclada pelo banco; próxima consulta abrirá nova conexão.');
      } else {
        console.error('[DB Pool] Erro no cliente SQL:', message);
      }
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });
