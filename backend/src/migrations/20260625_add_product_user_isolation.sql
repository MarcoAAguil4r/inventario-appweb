-- Adds logical data isolation by user to an existing database.
-- Existing products did not store an owner before this migration, so they are
-- assigned to the first user found. New users will only see their own products.

SET @legacy_user_id := (SELECT id_usuario FROM usuarios ORDER BY id_usuario ASC LIMIT 1);

SET @sql := IF(
  (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'productos'
      AND COLUMN_NAME = 'id_usuario'
  ) = 0,
  'ALTER TABLE productos ADD COLUMN id_usuario INT NULL AFTER id_producto',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE productos
SET id_usuario = @legacy_user_id
WHERE id_usuario IS NULL;

ALTER TABLE productos
  MODIFY COLUMN id_usuario INT NOT NULL;

SET @sql := IF(
  (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'productos'
      AND INDEX_NAME = 'idx_productos_usuario'
  ) = 0,
  'ALTER TABLE productos ADD INDEX idx_productos_usuario (id_usuario)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND CONSTRAINT_NAME = 'fk_productos_usuario'
  ) = 0,
  'ALTER TABLE productos ADD CONSTRAINT fk_productos_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
