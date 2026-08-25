import dotenv from "dotenv";
dotenv.config();

import pkg from "pg";
const { Pool } = pkg;

const rawConnectionString = process.env.DATABASE_URL || "";
const normalizedConnectionString = rawConnectionString
  .replace(/^DATABASE_URL\s*=\s*/, "")
  .trim()
  .replace(/^['"]|['"]$/g, "");

if (!normalizedConnectionString) {
  throw new Error("❌ DATABASE_URL is missing in environment variables.");
}

const pool = new Pool({
  connectionString: normalizedConnectionString,
  ssl: process.env.DB_SSL === "true"
    ? { rejectUnauthorized: false }
    : undefined,
  max: parseInt(process.env.DB_POOL_MAX || "10", 10),
  idleTimeoutMillis: 10000, // 10s: release idle sockets before Neon closes them
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

/**
 * Handle idle client errors without crashing the server process.
 * Neon serverless pooler frequently terminates idle sockets; pg will auto-reconnect on next query.
 */
pool.on("error", (err, client) => {
  console.warn("⚠️ PostgreSQL idle connection notice (auto-recovered):", err.message);
});

pool
  .connect()
  .then((client) => {
    console.log("✅ PostgreSQL (Neon) Connected Successfully");
    client.release();
  })
  .catch((err) => {
    console.warn("⚠️ PostgreSQL initial connect check notice:", err.message);
  });

export async function query(text, params) {
  return pool.query(text, params);
}

export async function withTransaction(callback) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await callback(client);

    await client.query("COMMIT");

    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export default pool;