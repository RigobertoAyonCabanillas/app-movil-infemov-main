import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

//Se crea el schema de la tabla de registro
export const usersdb = sqliteTable('usersdb', { 
  id: text('id').primaryKey(), // ID 
  nombres: text('nombres'),    // Quitamos .notNull() para evitar errores si vienen vacíos
  apellidos: text('apellidos'),
  correo: text('correo').notNull().unique(),
  telefono: text('telefono'),
  contrasena: text('contrasena').notNull(), // Esta sí es obligatoria
  token: text('token'),
  deviceId: text('deviceId'),
});