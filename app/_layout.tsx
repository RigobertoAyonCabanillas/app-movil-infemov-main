import { Stack } from 'expo-router';
import { Suspense } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { SQLiteProvider, useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { UserProvider } from "../components/UserContext";
import { PaperProvider } from 'react-native-paper';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from '../drizzle/migrations'; // Asegúrate de que la ruta sea correcta

export const BaseDatos = 'bdMovilFinal';

/**
 * Ahora solo configuramos el entorno. 
 * Las tablas las crea Drizzle automáticamente vía migraciones.
 */
async function initializeDatabase(db: SQLiteDatabase) {
  try {
    console.log("🛠️ [SQLite] Configurando PRAGMAs...");
    await db.execAsync(`PRAGMA journal_mode = WAL;`);
    await db.execAsync(`PRAGMA foreign_keys = ON;`);
  } catch (error) {
    console.error("❌ [SQLite] Error en initializeDatabase:", error);
    throw error;
  }
}

/**
 * Componente interno para manejar las migraciones antes de mostrar la app
 */
function AppContent() {
  const db = useSQLiteContext();
  const drizzleDb = drizzle(db);
  
  // Ejecuta las migraciones generadas por drizzle-kit
  const { success, error } = useMigrations(drizzleDb, migrations);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Text style={{ color: 'red', fontWeight: 'bold' }}>Error en Base de Datos:</Text>
        <Text>{error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#7da854" />
        <Text style={{ marginTop: 10 }}>Actualizando base de datos...</Text>
      </View>
    );
  }

  return (
    <UserProvider>
      <PaperProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ title: "Login" }} />
          <Stack.Screen name="register" options={{ title: "Registro" }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </PaperProvider>
    </UserProvider>
  );
}

export default function Layout() {
  return (
    <Suspense 
      fallback={
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#7da854" />
        </View>
      }
    >
      <SQLiteProvider 
        databaseName={BaseDatos} 
        onInit={initializeDatabase} 
        useSuspense
      >
        <AppContent />
      </SQLiteProvider>
    </Suspense>
  );
}