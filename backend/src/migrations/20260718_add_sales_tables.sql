CREATE TABLE IF NOT EXISTS ventas (
  id_venta INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  nota TEXT,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ventas_usuario (id_usuario),
  CONSTRAINT fk_ventas_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE IF NOT EXISTS detalle_venta (
  id_detalle_venta INT AUTO_INCREMENT PRIMARY KEY,
  id_venta INT NOT NULL,
  id_producto INT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10, 2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  INDEX idx_detalle_venta_venta (id_venta),
  INDEX idx_detalle_venta_producto (id_producto),
  CONSTRAINT fk_detalle_venta_venta
    FOREIGN KEY (id_venta) REFERENCES ventas(id_venta),
  CONSTRAINT fk_detalle_venta_producto
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);
