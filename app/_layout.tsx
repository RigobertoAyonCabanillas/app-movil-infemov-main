import { Stack } from 'expo-router';
import { Suspense, useEffect, useState, useRef } from 'react';
import { ActivityIndicator, View, StyleSheet, Animated, Easing } from 'react-native';
import { SQLiteProvider, useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { UserProvider } from "../components/UserContext";
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

function AppContent() {
  const db = useSQLiteContext();
  const drizzleDb = drizzle(db);
  const { success } = useMigrations(drizzleDb, migrations);

  const [phase, setPhase] = useState(1);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadePoweredBy = useRef(new Animated.Value(1)).current;
  const fadeLogoGrande = useRef(new Animated.Value(0)).current;

  // EFECTO 1: Arranca el movimiento apenas el JS carga
  useEffect(() => {
    // Iniciamos la animación de inmediato
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

    // Ocultamos la splash nativa lo más rápido posible
    const hideSplash = async () => {
      await SplashScreen.hideAsync();
    };
    hideSplash();

    return () => breath.stop();
  }, []);

  // EFECTO 2: Maneja la lógica de la base de datos y cambio de fase
  useEffect(() => {
    if (success) {
      const transition = async () => {
        // Esperamos 2 segundos para que se vea el logo animado
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

  return (
    <UserProvider>
      <PaperProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(settings)" />
        </Stack>
      </PaperProvider>
    </UserProvider>
  );
}

export default function Layout() {
  return (
    <Suspense fallback={<View style={styles.container}><ActivityIndicator color="#39FF14" /></View>}>
      <SQLiteProvider databaseName={BaseDatos} onInit={initializeDatabase} useSuspense>
        <AppContent />
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