import express from 'express';
import cors from 'cors';
import './env.js';
import authRoutes from './routes/auth.js';
import productosRoutes from './routes/productos.js';
import alertasRoutes from './routes/alertas.js';

const app = express();
const corsOrigin = process.env.CORS_ORIGIN ?? process.env.FRONTEND_URL ?? 'http://localhost:3000';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required.');
}

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'inventario-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/alertas', alertasRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

app.use((error, req, res, _next) => {
  const status = error.statusCode ?? error.status ?? 500;
  const isProduction = process.env.NODE_ENV === 'production';

  console.error('[API error]', {
    method: req.method,
    path: req.originalUrl,
    status,
    code: error.code,
    message: error.message,
    stack: isProduction ? undefined : error.stack,
  });

  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
    return res.status(503).json({
      error: 'No se pudo conectar con la base de datos. Revisa DATABASE_URL y que MySQL este disponible.',
    });
  }

  if (error.code === 'ER_NO_SUCH_TABLE') {
    return res.status(500).json({
      error: 'Faltan tablas en MySQL. Ejecuta backend/src/schema.sql antes de usar el sistema.',
    });
  }

  if (error.code === 'ER_ACCESS_DENIED_ERROR') {
    return res.status(503).json({
      error: 'MySQL rechazo las credenciales. Revisa usuario, password y DATABASE_URL.',
    });
  }

  return res.status(status).json({
    error: status >= 500 ? 'Error interno del servidor. Revisa la consola del backend para mas detalles.' : error.message,
  });
});

export default app;
