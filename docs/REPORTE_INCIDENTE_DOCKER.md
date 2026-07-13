# Reporte de incidente Docker

## Descripcion del problema

La rama `feature/docker-setup` no tenia una configuracion Docker completa para levantar el sistema. Al intentar operar el proyecto como contenedores no existia `docker-compose.yml` ni Dockerfiles para frontend y backend, por lo que el entorno no era reproducible desde Docker.

Ademas, durante la validacion inicial de Docker se detecto una advertencia reproducible de BuildKit cuando `CMD` se definia en formato shell:

```text
JSONArgsRecommended: JSON arguments recommended for CMD to prevent unintended behavior related to OS signals
```

## Impacto

- El equipo no podia levantar frontend, backend y MySQL con un unico comando.
- La validacion del entorno dependia de configuracion local manual.
- El uso de `CMD` en formato shell podia causar manejo incorrecto de senales al detener contenedores.

## Causa raiz

- Faltaban archivos de orquestacion Docker en la rama.
- No habia una convencion documentada para ejecutar los servicios contenedorizados.
- El arranque de contenedores debe declararse en formato exec para evitar problemas operativos.

## Solucion aplicada

- Se agrego `Dockerfile` para el frontend Next.js.
- Se agrego `backend/Dockerfile` para la API Express.
- Se agrego `.dockerignore` para reducir contexto de build.
- Se agrego `docker-compose.yml` con servicios `frontend`, `backend` y `db`.
- Se activo `output: "standalone"` en Next para producir una imagen de runtime mas ligera.
- Se usaron comandos `CMD` en formato JSON/exec.

## Evidencia antes

Estado de la rama antes del fix:

```text
No existia docker-compose.yml.
No existian Dockerfile ni backend/Dockerfile.
```

Problema reproducible esperado al intentar usar Compose:

```powershell
docker compose config
```

Resultado esperado antes del fix:

```text
no configuration file provided: not found
```

Advertencia reproducible detectada en validacion Docker previa:

```text
JSONArgsRecommended: JSON arguments recommended for CMD to prevent unintended behavior related to OS signals
```

## Evidencia despues

Comandos de validacion:

```powershell
docker compose config
docker build -t inventario-frontend:docker-setup .
docker build -t inventario-backend:docker-setup .\backend
```

Resultado esperado:

```text
La configuracion de Compose se parsea correctamente.
Las imagenes de frontend y backend construyen usando CMD en formato exec.
```

## Prevencion de recurrencia

- Mantener Dockerfiles versionados junto con el codigo que ejecutan.
- Usar `docker compose config` como validacion rapida de sintaxis.
- Mantener `CMD` y `ENTRYPOINT` en formato JSON/exec.
- Evitar depender de `latest` cuando se necesite reproducibilidad estricta.

## Commits relacionados

- `7d4587a` - Add Docker setup for app services

## Entregable individual

### Que parte resolvi

Agregue la configuracion Docker para frontend, backend y base de datos, documente la causa raiz y deje evidencia de validacion antes/despues.

### Que aprendi

Aprendi que un entorno Docker no solo debe construir imagenes: tambien debe ser reproducible, documentado y operar con comandos de arranque robustos para ambientes reales.

### Link a evidencia

Evidencia local en este archivo: `docs/REPORTE_INCIDENTE_DOCKER.md`.
