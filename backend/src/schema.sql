CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  id_propietario INT NULL,
  nombre VARCHAR(120) NOT NULL,
  correo VARCHAR(180) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(50) NOT NULL DEFAULT 'propietario',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_usuarios_propietario (id_propietario),
  CONSTRAINT fk_usuarios_propietario
    FOREIGN KEY (id_propietario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id_reset INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL DEFAULT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_password_reset_usuario (id_usuario),
  INDEX idx_password_reset_token_hash (token_hash),
  CONSTRAINT fk_password_reset_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS productos (
  id_producto INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  nombre VARCHAR(160) NOT NULL,
  categoria VARCHAR(120) NOT NULL,
  precio_compra DECIMAL(10, 2) NOT NULL DEFAULT 0,
  precio_venta DECIMAL(10, 2) NOT NULL DEFAULT 0,
  stock_actual INT NOT NULL DEFAULT 0,
  stock_minimo INT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_productos_usuario (id_usuario),
  CONSTRAINT fk_productos_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE IF NOT EXISTS productos_danados (
  id_producto_danado INT AUTO_INCREMENT PRIMARY KEY,
  id_producto_original INT NOT NULL,
  cantidad INT NOT NULL,
  precio_reducido DECIMAL(10, 2) NOT NULL DEFAULT 0,
  descripcion_dano TEXT NOT NULL,
  vendible BOOLEAN NOT NULL DEFAULT TRUE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_productos_danados_producto
    FOREIGN KEY (id_producto_original) REFERENCES productos(id_producto)
);

CREATE TABLE IF NOT EXISTS mermas (
  id_merma INT AUTO_INCREMENT PRIMARY KEY,
  id_producto INT NOT NULL,
  id_usuario INT NOT NULL,
  cantidad INT NOT NULL,
  motivo TEXT NOT NULL,
  costo_perdida DECIMAL(10, 2) NOT NULL DEFAULT 0,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mermas_usuario (id_usuario),
  CONSTRAINT fk_mermas_producto
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto),
  CONSTRAINT fk_mermas_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE IF NOT EXISTS ventas (
  id_venta INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  folio VARCHAR(20) NULL,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  nota TEXT,
  estado VARCHAR(20) NOT NULL DEFAULT 'CONFIRMADA',
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ventas_usuario (id_usuario),
  INDEX idx_ventas_folio (folio),
  INDEX idx_ventas_usuario_estado_fecha (id_usuario, estado, creado_en),
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

CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id_movimiento INT AUTO_INCREMENT PRIMARY KEY,
  id_producto INT NOT NULL,
  tipo_movimiento VARCHAR(80) NOT NULL,
  cantidad INT NOT NULL DEFAULT 0,
  stock_anterior INT NOT NULL,
  stock_nuevo INT NOT NULL,
  motivo TEXT,
  id_usuario INT NULL,
  fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_movimientos_usuario (id_usuario),
  CONSTRAINT fk_movimientos_producto
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto),
  CONSTRAINT fk_movimientos_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
