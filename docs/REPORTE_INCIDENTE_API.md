# Reporte de incidente API no responde

## Descripcion del problema

El backend tenia un endpoint de salud disponible en `/api/health`, pero no respondia en `/health`. Esto genera un incidente de disponibilidad porque herramientas comunes de monitoreo, balanceadores o healthchecks de contenedores suelen consultar `/health` para decidir si la API esta lista.

## Impacto

- Un monitor que consulte `/health` marcaria la API como caida.
- Docker Compose no podia esperar a que el backend estuviera saludable antes de iniciar el frontend.
- El sistema podia iniciar servicios dependientes antes de que la API estuviera lista.

## Causa raiz

La aplicacion Express solo registraba la ruta `/api/health`:

```js
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'inventario-backend' });
});
```

No existia alias `/health` ni healthcheck en el contenedor del backend.

## Error reproducible

Imagen previa:

```powershell
docker build -t inventario-backend:api-before .\backend
docker run -d --rm --name inventario-api-before -p 4100:4000 -e JWT_SECRET=test -e DATABASE_URL=mysql://inventario:inventario@localhost:3306/inventario inventario-backend:api-before
Invoke-WebRequest -UseBasicParsing http://localhost:4100/health
```

Resultado:

```text
{"error":"Ruta no encontrada."}
```

Control de comparacion:

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:4100/api/health
```

Resultado:

```text
StatusCode: 200
Content: {"ok":true,"service":"inventario-backend"}
```

## Fix aplicado en codigo

- Se creo un handler compartido `healthHandler`.
- Se expuso el mismo estado de salud en `/health` y `/api/health`.
- Se agrego `HEALTHCHECK` al `backend/Dockerfile`.
- Se agrego `healthcheck` al servicio `backend` en `docker-compose.yml`.
- El frontend ahora espera `condition: service_healthy` del backend.

## Validacion posterior

Comandos:

```powershell
docker compose config
docker build -t inventario-backend:api-after .\backend
docker run -d --rm --name inventario-api-after -p 4101:4000 -e JWT_SECRET=test -e DATABASE_URL=mysql://inventario:inventario@localhost:3306/inventario inventario-backend:api-after
Invoke-WebRequest -UseBasicParsing http://localhost:4101/health
```

Resultado obtenido:

```text
StatusCode: 200
Content: {"ok":true,"service":"inventario-backend"}
```

Validacion del healthcheck del contenedor:

```powershell
docker inspect --format '{{json .State.Health}}' inventario-api-after
```

Resultado obtenido:

```text
{"Status":"healthy","FailingStreak":0}
```

## Prevencion de recurrencia

- Mantener `/health` como endpoint estable para monitoreo.
- Validar `docker compose config` antes de subir cambios Docker.
- Mantener healthchecks de contenedor para detectar APIs no disponibles.
- Hacer que servicios dependientes esperen a `service_healthy`.

## Commits relacionados

- `42383ce` - Fix API healthcheck availability

## Entregable individual

### Que parte resolvi

Reproduje el fallo de disponibilidad en `/health`, implemente el endpoint faltante, agregue healthchecks en Docker y valide la respuesta posterior.

### Que aprendi

Aprendi que una API puede estar tecnicamente levantada y aun asi fallar para monitoreo si no expone un endpoint estandar de salud. Los healthchecks ayudan a convertir ese problema en una validacion automatica.

### Link a evidencia

Evidencia local en este archivo: `docs/REPORTE_INCIDENTE_API.md`.
