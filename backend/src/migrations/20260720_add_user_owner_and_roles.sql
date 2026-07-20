ALTER TABLE usuarios
  ADD COLUMN id_propietario INT NULL AFTER id_usuario;

UPDATE usuarios
SET rol = 'propietario'
WHERE rol = 'admin';

UPDATE usuarios
SET id_propietario = id_usuario
WHERE id_propietario IS NULL AND rol = 'propietario';

UPDATE usuarios
SET id_propietario = (
  SELECT propietario_id
  FROM (
    SELECT id_usuario AS propietario_id
    FROM usuarios
    WHERE rol = 'propietario'
    ORDER BY id_usuario ASC
    LIMIT 1
  ) propietario
)
WHERE id_propietario IS NULL;

ALTER TABLE usuarios
  MODIFY rol VARCHAR(50) NOT NULL DEFAULT 'propietario',
  ADD INDEX idx_usuarios_propietario (id_propietario),
  ADD CONSTRAINT fk_usuarios_propietario
    FOREIGN KEY (id_propietario) REFERENCES usuarios(id_usuario);
