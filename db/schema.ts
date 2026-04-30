import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

//Se crea el schema de la tabla de registro
export const usersdb = sqliteTable('usersdb', { 
  id: integer('id').primaryKey(), // ID 
  nombres: text('nombres'),    // Quitamos .notNull() para evitar errores si vienen vacíos
  apellidoPaterno: text('apellidoPaterno'),
  apellidoMaterno: text('apellidoMaterno'),
  correo: text('correo'),
  telefono: text('telefono'),
  contrasena: text('contrasena'), // Esta sí es obligatoria
  estudiante: text('estudiante'),
  fechaNacimiento: text('fechaNacimiento'),
  token: text('token'),
  deviceId: text('deviceId'),
  gymId: integer("gymId"), // Añadir este campo si no existe
  rol: text('rol').$type<'cliente' | 'coach'>().default('cliente'),
});

export const membresiasdb = sqliteTable('membresiasdb', {
  // En SQLite con Drizzle, autoIncrement va dentro de un objeto de configuración
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }), 
  folioMembresia: text('folioMembresia'), // Cámbialo a text si el folio lleva letras
  tipo: text('tipo'),
  fechaInicio: text('fechaInicio'),
  fechaFin: text('fechaFin'),
  estatus: integer('estatus'), // SQLite no tiene boolean real, usa 0 o 1
  userId: integer('userId'),
  gymId: integer('gymId'),
});

export const creditosdb = sqliteTable('creditosdb', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  folioCredito: text('folioCredito'),
  paquete: text('paquete'),
  fechaPago: text('fechaPago'),
  fechaExpiracion: text('fechaExpiracion'),
  estatus: integer('estatus'), // 1: Activo, 0: Agotado/Vencido
  userId: integer('userId'),
  gymId: integer('gymId'),
});

export const reservacionesdb = sqliteTable('reservacionesdb', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  claseId: integer('clase_id').notNull(),
  nombreClase: text('nombre_clase').notNull(),
  horaInicio: text('hora_inicio').notNull(),
  horaFin: text('hora_fin').notNull(),
  fecha: text('fecha').notNull(),
  estado: text('estado').notNull(), // 'INSCRITO', 'ESPERA', 'DISPONIBLE'
  lugar: integer('lugar').default(0),
  
  // CAMPOS EXTRA PARA LÓGICA DE INTERFAZ
  coach: text('coach'), // Para mostrar quién da la clase
  vacantes: integer('vacantes').default(0), // Para saber si está LLENO
  tipoClaseID: integer('tipo_clase_id'), // Para el MAPA_DISCIPLINAS
  
  // GUARDAR ARRAYS COMO TEXTO (JSON.stringify)
  lugaresOcupados: text('lugares_ocupados'), // Para calcular si hay lugar
  esperaUsers: text('espera_users'), // Para saber la fila de espera
});