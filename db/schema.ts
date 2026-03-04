import { boolean } from 'drizzle-orm/gel-core';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

//Se crea el schema de la tabla de registro
export const usersdb = sqliteTable('usersdb', { 
  id: integer('id').primaryKey(), // ID 
  nombres: text('nombres'),    // Quitamos .notNull() para evitar errores si vienen vacíos
  apellidoPaterno: text('apellidoPaterno'),
  apellidoMaterno: text('apellidoMaterno'),
  correo: text('correo').unique(),
  telefono: text('telefono'),
  contrasena: text('contrasena').notNull(), // Esta sí es obligatoria
  token: text('token'),
  deviceId: text('deviceId'),
});

export const membresiasdb = sqliteTable('membresiasdb', {
  // En SQLite con Drizzle, autoIncrement va dentro de un objeto de configuración
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }), 
  folio: text('folio'), // Cámbialo a text si el folio lleva letras
  tipo: text('tipo'),
  fechaInicio: text('fechaInicio'),
  fechaFin: text('fechaFin'),
  status: integer('status'), // SQLite no tiene boolean real, usa 0 o 1
});

export const creditosdb = sqliteTable('creditosdb', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  folioCredito: text('folioCredito'),
  paquete: text('paquete'),
  tipo: text('tipo'),
  fechaPago: text('fechaPago'),
  fechaExpiracion: text('fechaExpiracion'),
  estatus: integer('estatus'), // 1: Activo, 0: Agotado/Vencido
});