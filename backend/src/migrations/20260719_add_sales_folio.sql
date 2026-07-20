ALTER TABLE ventas
  ADD COLUMN folio VARCHAR(20) NULL AFTER id_usuario,
  ADD INDEX idx_ventas_folio (folio);
