import { Stack } from 'expo-router';
import { Suspense, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SQLiteProvider, openDatabaseSync } from 'expo-sqlite';
import { UserProvider } from "../components/UserContext";

// Definimos el nombre de la base de datos de forma global
export const BaseDatos = 'bdMovil';

export default function Layout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function setup() {
      try {
        // Abrimos la conexión dentro del efecto
        const db = openDatabaseSync(BaseDatos);
        
        // Ejecutamos la creación
        await db.execAsync(`
          PRAGMA journal_mode = WAL;
          CREATE TABLE IF NOT EXISTS usersdb (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombres TEXT NOT NULL,
            apellidos TEXT NOT NULL,
            correo TEXT NOT NULL UNIQUE,
            telefono TEXT NOT NULL,
            contrasena TEXT NOT NULL,
            token TEXT
          );
        `);
        
        console.log("✅ [SQLite] Tabla preparada correctamente");
        setIsReady(true);
      } catch (error) {
        console.error("❌ [SQLite] Error en el setup:", error);
        // Incluso si falla, dejamos que la app intente cargar para ver el error en pantalla
        setIsReady(true); 
      }
    }
    setup();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <Suspense fallback={<ActivityIndicator size="large" />}>
      {/* SQLiteProvider permite que useSQLiteContext funcione en tus servicios */}
      <SQLiteProvider databaseName={BaseDatos} useSuspense>
        <UserProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ title: "Login" }} />
            <Stack.Screen name="register" options={{ title: "Registro" }} />
            <Stack.Screen name="home" options={{ title: "Inicio" }} />
          </Stack>
        </UserProvider>
      </SQLiteProvider>
    </Suspense>
  );
}