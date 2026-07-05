# Diagrama secuencial del despliegue y uso del sistema

Este documento describe los flujos principales del sistema despues del despliegue:

- Despliegue del frontend en Vercel.
- Despliegue del backend en Railway.
- Uso de la aplicacion por parte del usuario.
- Autenticacion y consulta de inventario.

## 0. Diagrama de flujo principal del MVP

```mermaid
flowchart TD
    A[Inicio del MVP] --> B[Deploy del sistema]

    B --> B1[Frontend desplegado en Vercel]
    B --> B2[Backend desplegado en Railway]
    B --> B3[Base de datos MySQL en Railway]

    B1 --> C[Usuario abre la aplicacion web]
    C --> D{Usuario tiene sesion activa?}

    D -- No --> E[Login]
    E --> F[Usuario ingresa correo y password]
    F --> G[Backend valida credenciales]
    G --> H{Credenciales validas?}

    H -- No --> I[Muestra error de login]
    I --> E

    H -- Si --> J[Backend genera token JWT]
    J --> K[Frontend guarda token]
    K --> L[Acceso al flujo principal]

    D -- Si --> L

    L --> M[Consultar inventario]
    M --> N[Backend valida token JWT]
    N --> O{Token valido?}

    O -- No --> E
    O -- Si --> P[Backend consulta productos en MySQL]
    P --> Q[Frontend muestra tabla de inventario]

    Q --> R{Accion del usuario}
    R -- Registrar producto --> S[Formulario de nuevo producto]
    R -- Actualizar producto --> T[Formulario de edicion]
    R -- Consultar datos --> M

    S --> U[Backend valida datos]
    T --> U
    U --> V[Guarda cambios en MySQL]
    V --> W[Registra movimiento de inventario]
    W --> X[Actualiza resumen e inventario]
    X --> Q

    B2 --> Y[Healthcheck /api/health]
    Y --> Z{Backend saludable?}
    Z -- Si --> C
    Z -- No --> AA[Revisar variables, logs y conexion a BD]
    AA --> B
```
## 1. Flujo general de arquitectura

```mermaid
sequenceDiagram
    actor Usuario
    participant Vercel as Frontend en Vercel
    participant RailwayAPI as Backend Express en Railway
    participant RailwayDB as MySQL en Railway

    Usuario->>Vercel: Abre la aplicacion web
    Vercel-->>Usuario: Entrega paginas Next.js
    Usuario->>Vercel: Interactua con login/inventario
    Vercel->>RailwayAPI: Solicitud HTTP a NEXT_PUBLIC_API_URL
    RailwayAPI->>RailwayDB: Consulta o actualiza datos
    RailwayDB-->>RailwayAPI: Devuelve resultado SQL
    RailwayAPI-->>Vercel: Respuesta JSON
    Vercel-->>Usuario: Actualiza la interfaz
```

## 2. Flujo de despliegue

```mermaid
sequenceDiagram
    actor Desarrollador
    participant GitHub as Rama feature/flujo-principal
    participant Vercel as Proyecto Vercel Frontend
    participant RailwayAPI as Servicio backend Railway
    participant RailwayDB as Servicio MySQL Railway

    Desarrollador->>GitHub: Sube commits de preparacion de despliegue
    Desarrollador->>RailwayDB: Verifica o reactiva MySQL
    RailwayDB-->>Desarrollador: MySQL queda en estado SUCCESS
    Desarrollador->>RailwayAPI: Despliega backend desde carpeta backend
    RailwayAPI->>RailwayAPI: Ejecuta npm start
    RailwayAPI->>RailwayAPI: Expone /api/health
    RailwayAPI-->>Desarrollador: Backend queda disponible
    Desarrollador->>Vercel: Configura NEXT_PUBLIC_API_URL
    Desarrollador->>Vercel: Despliega frontend Next.js
    Vercel-->>Desarrollador: Genera dominio de produccion
    Desarrollador->>RailwayAPI: Configura CORS_ORIGIN y FRONTEND_URL
    RailwayAPI-->>Desarrollador: Acepta peticiones del dominio Vercel
```

## 3. Flujo de inicio de sesion

```mermaid
sequenceDiagram
    actor Usuario
    participant UI as Frontend Vercel
    participant API as Backend Railway
    participant DB as MySQL Railway

    Usuario->>UI: Ingresa correo y password
    UI->>API: POST /api/auth/login
    API->>DB: SELECT usuario por correo
    DB-->>API: Devuelve usuario y password_hash
    API->>API: Valida password con bcrypt
    alt Credenciales validas
        API->>API: Genera token JWT
        API-->>UI: 200 OK con token y usuario
        UI->>UI: Guarda token en localStorage
        UI-->>Usuario: Redirige al inventario
    else Credenciales invalidas
        API-->>UI: 401 Credenciales incorrectas
        UI-->>Usuario: Muestra mensaje de error
    end
```

## 4. Flujo de consulta de inventario

```mermaid
sequenceDiagram
    actor Usuario
    participant UI as Frontend Vercel
    participant API as Backend Railway
    participant Auth as Middleware JWT
    participant DB as MySQL Railway

    Usuario->>UI: Abre pagina /inventario
    UI->>UI: Lee token desde localStorage
    UI->>API: GET /api/productos con Authorization Bearer
    API->>Auth: Valida token JWT
    alt Token valido
        Auth-->>API: Permite continuar
        API->>DB: SELECT productos
        DB-->>API: Lista de productos
        API-->>UI: 200 OK con productos
        UI-->>Usuario: Renderiza tabla de inventario
    else Token invalido o ausente
        Auth-->>API: Rechaza solicitud
        API-->>UI: 401 Token requerido o invalido
        UI-->>Usuario: Redirige a login
    end
```

## 5. Flujo de registro o actualizacion de producto

```mermaid
sequenceDiagram
    actor Usuario
    participant UI as Frontend Vercel
    participant API as Backend Railway
    participant Auth as Middleware JWT
    participant DB as MySQL Railway

    Usuario->>UI: Llena formulario de producto
    UI->>API: POST /api/productos o PUT /api/productos/:id
    API->>Auth: Valida token JWT
    Auth-->>API: Token valido
    API->>API: Valida datos del producto
    API->>DB: Inicia transaccion
    API->>DB: Inserta o actualiza producto
    API->>DB: Registra movimiento de inventario
    API->>DB: Confirma transaccion
    DB-->>API: Producto actualizado
    API-->>UI: 200/201 con producto
    UI->>API: Recarga resumen, movimientos e inventario
    API-->>UI: Datos actualizados
    UI-->>Usuario: Muestra inventario actualizado
```

## 6. Flujo de healthcheck

```mermaid
sequenceDiagram
    participant Railway as Railway Healthcheck
    participant API as Backend Express

    Railway->>API: GET /api/health
    API-->>Railway: { ok: true, service: "inventario-backend" }
    Railway->>Railway: Marca deployment como saludable
```

## 7. Puntos de control para auditoria

- El frontend no consulta directamente a MySQL.
- Todas las operaciones de datos pasan por el backend.
- Las rutas de inventario requieren JWT.
- El backend valida CORS usando el dominio de Vercel.
- Railway verifica disponibilidad con `/api/health`.
- MySQL permanece aislado como servicio de base de datos en Railway.

