import mysql from 'mysql2/promise';
import { env } from './env.js';

// One shared pool supports local MySQL and TLS-enabled TiDB deployments.
export const pool = mysql.createPool({
  host: env.database.host,
  port: env.database.port,
  user: env.database.user,
  password: env.database.password,
  database: env.database.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 5000,
  decimalNumbers: true,
  ssl: env.database.ssl ? { minVersion: 'TLSv1.2' } : undefined,
});

export const query = async (sql, parameters = []) => {
  const [rows] = await pool.execute(sql, parameters);
  return rows;
};

export const testDatabaseConnection = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
};

export const closeDatabase = () => pool.end();
