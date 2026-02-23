import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

//Se crea el schema de la tabla de registro
export const usersdb = sqliteTable('usersdb', { 
    id: integer('id').primaryKey({ autoIncrement: true }),
    nombres: text('nombres').notNull(),
    apellidos: text('apellidos').notNull(),
    correo: text('correo').notNull().unique(),
    telefono: text('telefono').notNull(),
    contrasena: text('contrasena').notNull(),
    token: text('token'), //Nueva columna para el JWT de la API o Google
});