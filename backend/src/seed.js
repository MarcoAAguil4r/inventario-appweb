import bcrypt from 'bcrypt';
import './env.js';
import { query, pool } from './db.js';

const nombre = process.env.SEED_USER_NAME ?? 'Administrador';
const correo = (process.env.SEED_USER_EMAIL ?? 'admin@inventario.local').toLowerCase();
const password = process.env.SEED_USER_PASSWORD ?? 'Admin123!';

const existing = await query('SELECT id_usuario FROM usuarios WHERE correo = ? LIMIT 1', [correo]);

if (existing.length > 0) {
  console.log(`Seed user already exists: ${correo}`);
  await pool.end();
  process.exit(0);
}

const passwordHash = await bcrypt.hash(password, 12);

await query(
  'INSERT INTO usuarios (nombre, correo, password_hash, rol, activo) VALUES (?, ?, ?, ?, true)',
  [nombre, correo, passwordHash, 'admin'],
);

console.log(`Seed user created: ${correo}`);
await pool.end();
