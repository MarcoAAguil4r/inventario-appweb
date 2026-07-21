ALTER TABLE productos_danados
ADD COLUMN cantidad_disponible INT NOT NULL DEFAULT 0
AFTER cantidad;

UPDATE productos_danados
SET cantidad_disponible = cantidad
WHERE cantidad_disponible = 0;