import mysql from 'mysql2/promise';
import './env.js';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for the MySQL connection.');
}

export const pool = mysql.createPool(process.env.DATABASE_URL);

export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export async function withTransaction(callback) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
