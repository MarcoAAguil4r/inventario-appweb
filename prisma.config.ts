import { defineConfig } from '@prisma/config';
import { config } from 'dotenv';

// Esto fuerza la lectura de tu archivo .env en la raíz antes de exportar
config();

export default defineConfig({
  datasource: {
    url: process.env.POSTGRES_URL!, 
  },
});