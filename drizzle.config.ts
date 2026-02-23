import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './db/schema.ts', // Ruta a tus tablas
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'expo', 
  dbCredentials: {
    url: 'sqlite.db', // El nombre de tu archivo .db (ej: 'users.db')
  },
});