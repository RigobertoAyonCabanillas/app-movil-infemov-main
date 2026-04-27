import { Stack } from 'expo-router';
import { Suspense, useEffect, useState, useRef, useContext } from 'react';
import { ActivityIndicator, View, StyleSheet, Animated, Easing } from 'react-native';
import { SQLiteProvider, useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { UserProvider, UserContext } from "../components/UserContext";
import { PaperProvider } from 'react-native-paper';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from '../drizzle/migrations'; 
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export const BaseDatos = 'bdMovilFinal';

async function initializeDatabase(db: SQLiteDatabase) {
  try {
    await db.execAsync(`PRAGMA journal_mode = WAL;`);
    await db.execAsync(`PRAGMA foreign_keys = ON;`);
  } catch (error) { console.error(error); throw error; }
}

/**
 * 🛡️ RootNavigation: Controla dinámicamente el árbol de rutas.
 * Si users es null, las rutas de (tabs) y (settings) NO EXISTEN.
 * Esto limpia el historial y evita el retroceso tras el logout.
 */
function RootNavigation() {
  const { users } = useContext(UserContext);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!users ? (
        // Al estar solo esta pantalla, el historial se reduce a 1 solo elemento
        <Stack.Screen name="index" options={{ gestureEnabled: false }} />
      ) : (
        <>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(settings)" />
        </>
      )}
    </Stack>
  );
}

function AppContent() {
  const db = useSQLiteContext();
  const drizzleDb = drizzle(db);
  const { success } = useMigrations(drizzleDb, migrations);

  const [phase, setPhase] = useState(1);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadePoweredBy = useRef(new Animated.Value(1)).current;
  const fadeLogoGrande = useRef(new Animated.Value(0)).current;

  // Animación de respiración inicial
  useEffect(() => {
    const breath = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    breath.start();

    const hideSplash = async () => {
      await SplashScreen.hideAsync();
    };
    hideSplash();

    return () => breath.stop();
  }, []);

  // Transición de Splash Screen personalizada
  useEffect(() => {
    if (success) {
      const transition = async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));

        Animated.timing(fadePoweredBy, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setPhase(2);
          Animated.timing(fadeLogoGrande, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }).start(async () => {
            await new Promise(resolve => setTimeout(resolve, 1500));
            setPhase(3);
          });
        });
      };
      transition();
    }
  }, [success]);

  // Pantallas de Carga (Fase 1 y 2)
  if (!success || phase < 3) {
    return (
      <View style={styles.container}>
        {phase === 1 && (
          <Animated.View style={{ 
            opacity: fadePoweredBy, 
            transform: [{ scale: pulseAnim }] 
          }}>
            <Animated.Image 
              source={require('../assets/images/logoPoweredByFixskale.png')} 
              style={styles.poweredBy}
              resizeMode="contain"
            />
          </Animated.View>
        )}

        {phase === 2 && (
          <Animated.View style={{ opacity: fadeLogoGrande }}>
            <Animated.Image 
              source={require('../assets/images/FSCarga.png')} 
              style={styles.logoGrande}
              resizeMode="contain"
            />
          </Animated.View>
        )}
      </View>
    );
  }

  // Contenido Principal (Fase 3)
  return (
    <PaperProvider>
      <RootNavigation />
    </PaperProvider>
  );
}

export default function Layout() {
  return (
    <Suspense fallback={<View style={styles.container}><ActivityIndicator color="#39FF14" /></View>}>
      <SQLiteProvider databaseName={BaseDatos} onInit={initializeDatabase} useSuspense>
        {/* IMPORTANTE: UserProvider debe envolver a AppContent para que 
          RootNavigation pueda acceder al contexto correctamente.
        */}
        <UserProvider>
          <AppContent />
        </UserProvider>
      </SQLiteProvider>
    </Suspense>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  poweredBy: { width: 220, height: 220 },
  logoGrande: { width: 320, height: 320 },
});