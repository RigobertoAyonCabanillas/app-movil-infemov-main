import { Stack } from 'expo-router';
import { Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { UserProvider } from "../components/UserContext";

// Definimos el nombre de la base de datos de forma global
export const BaseDatos = 'bdMovil';

/**
 * Función de inicialización de la base de datos.
 * Se ejecuta una sola vez cuando el SQLiteProvider se monta.
 * Esto garantiza que la conexión sea única y estable para toda la app.
 */
async function initializeDatabase(db: SQLiteDatabase) {
  try {
    console.log("🛠️ [SQLite] Iniciando configuración de tablas...");
    
    // Configuramos el modo WAL para mejor rendimiento en escrituras concurrentes
    await db.execAsync(`PRAGMA journal_mode = WAL;`);

    // Creamos la tabla con las restricciones necesarias
    // Nota: 'correo' es UNIQUE para que el 'onConflict' de Drizzle/SQLite funcione
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS usersdb (
        id INTEGER PRIMARY KEY,
        nombres TEXT,
        apellidoPaterno TEXT,
        apellidoMaterno TEXT,
        correo TEXT UNIQUE,
        telefono TEXT,
        contrasena TEXT NOT NULL,
        estudiante TEXT,
        fechaNacimiento TEXT,
        token TEXT,
        deviceId TEXT,
        gymId INTEGER
      );
      CREATE TABLE IF NOT EXISTS membresiasdb (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        folioMembresia TEXT,
        tipo TEXT,
        fechaInicio TEXT,
        fechaFin TEXT,
        estatus INTEGER,
        userId INTEGER
      );
      CREATE TABLE IF NOT EXISTS creditosdb (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      folioCredito TEXT,
      paquete TEXT,
      tipo TEXT,
      fechaPago TEXT,
      fechaExpiracion TEXT,
      estatus INTEGER,
      userId INTEGER
    );
    `);
    
    console.log("✅ [SQLite] Base de datos y tablas preparadas correctamente");
  } catch (error) {
    console.error("❌ [SQLite] Error crítico en initializeDatabase:", error);
    throw error; // Suspense capturará esto si es necesario
  }
}

export default function Layout() {
  return (
    // Suspense mostrará el fallback mientras initializeDatabase termina su ejecución
    <Suspense 
      fallback={
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      }
    >
      {/* SQLiteProvider centraliza la conexión. 
          onInit: Ejecuta la creación de tablas de forma segura.
          useSuspense: Bloquea el renderizado de los hijos hasta que la DB esté lista.
      */}
      <SQLiteProvider 
        databaseName={BaseDatos} 
        onInit={initializeDatabase} 
        useSuspense
      >
        <UserProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ title: "Login" }} />
            <Stack.Screen name="register" options={{ title: "Registro" }} />
            {/* Grupo de pestañas principales tras el login */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </UserProvider>
      </SQLiteProvider>
    </Suspense>
  );
}