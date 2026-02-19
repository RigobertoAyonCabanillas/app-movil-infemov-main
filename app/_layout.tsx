import { Stack } from 'expo-router';
import { Suspense } from 'react';
import { ActivityIndicator } from 'react-native';
import { SQLiteProvider, openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from '@/drizzle/migrations';
import { UserProvider } from "../components/UserContext";

export const DATABASE_NAME = 'tasks';

export default function Layout() {

  const expoDb = openDatabaseSync(DATABASE_NAME); //Creacion de la base de datos
  const db = drizzle(expoDb);//Esquema de base de datos db
  const { success, error } = useMigrations(db, migrations); //Migraciones en la base de datos

  // Mientras se aplican las migraciones de la DB local
  if (error) {
    return <ActivityIndicator size="small" color="red" />; 
  }
  if (!success) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <Suspense fallback={<ActivityIndicator size="large" />}>
      <SQLiteProvider
        databaseName={DATABASE_NAME}
        options={{ enableChangeListener: true }}
        useSuspense
      >
        <UserProvider>
          <Stack>
            <Stack.Screen name="index" options={{ title: "Login" }} />
            <Stack.Screen name="register" options={{ title: "Register" }} />
            <Stack.Screen name="home" options={{ title: "Home" }} />
          </Stack>
        </UserProvider>
      </SQLiteProvider>
    </Suspense>
  );
}