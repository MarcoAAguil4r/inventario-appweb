import './env.js';
import { query } from './db.js';

await query(`CREATE TABLE IF NOT EXISTS ventas (
  id_venta INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  folio VARCHAR(20) NOT NULL UNIQUE,
  estado VARCHAR(20) NOT NULL DEFAULT 'CONFIRMADA',
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ventas_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
)`);

await query(`CREATE TABLE IF NOT EXISTS detalle_venta (
  id_detalle INT AUTO_INCREMENT PRIMARY KEY,
  id_venta INT NOT NULL,
  id_producto INT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_detalle_venta FOREIGN KEY (id_venta) REFERENCES ventas(id_venta),
  CONSTRAINT fk_detalle_producto FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
)`);

try {
  await query(`ALTER TABLE movimientos_inventario ADD COLUMN id_venta INT NULL DEFAULT NULL`);
} catch (e) {
  if (e.code === 'ER_DUP_FIELDNAME') {
    console.log('Columna id_venta ya existe, omitiendo.');
  } else {
    throw e;
  }
}