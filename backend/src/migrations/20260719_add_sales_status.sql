ALTER TABLE ventas
  ADD COLUMN estado VARCHAR(20) NOT NULL DEFAULT 'CONFIRMADA' AFTER nota,
  ADD INDEX idx_ventas_usuario_estado_fecha (id_usuario, estado, creado_en);
