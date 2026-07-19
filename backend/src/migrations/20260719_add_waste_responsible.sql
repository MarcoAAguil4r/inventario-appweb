ALTER TABLE mermas
  ADD COLUMN id_usuario INT NULL AFTER id_producto;

UPDATE mermas m
INNER JOIN productos p ON p.id_producto = m.id_producto
SET m.id_usuario = p.id_usuario
WHERE m.id_usuario IS NULL;

ALTER TABLE mermas
  MODIFY id_usuario INT NOT NULL,
  ADD INDEX idx_mermas_usuario (id_usuario),
  ADD CONSTRAINT fk_mermas_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario);

ALTER TABLE movimientos_inventario
  ADD COLUMN id_usuario INT NULL AFTER motivo,
  ADD INDEX idx_movimientos_usuario (id_usuario),
  ADD CONSTRAINT fk_movimientos_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario);
