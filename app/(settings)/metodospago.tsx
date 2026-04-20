import React, { useState, useContext, useEffect, useRef } from 'react';
import { 
  View, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, Alert, Dimensions, AppState 
} from 'react-native';
import { Text, Surface, IconButton } from 'react-native-paper';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { UserContext } from '../../components/UserContext'; 
import { crearSesionCheckout, verificarPagoStripe } from '@/services/api';

const { width } = Dimensions.get('window');

const COLORS = {
  bg: '#000000',
  cardBg: '#121212',
  accent: '#39FF14',
  textMain: '#FFFFFF',
  textSub: '#A0A0A0',
  price: '#FFD700',
};

const PAQUETES = [
  { id: '1credito', nombre: '1 Crédito', desc: 'Válido por 30 días', precio: '$99', tipo: 'C' },
  { id: '5clases', nombre: 'Paquete 5 Clases', desc: '5 Clases', precio: '$400', tipo: 'C' },
  { id: '5creditos', nombre: '5 Créditos', desc: 'Válido por 60 días', precio: '$450', tipo: 'C' },
  { id: '10creditos', nombre: '10 Créditos', desc: 'Válido por 90 días', precio: '$800', tipo: 'C' },
  { id: '10clases_300', nombre: '10 Clases Promo', desc: '10 Clases', precio: '$300', tipo: 'C' },
  { id: '10clases_100', nombre: '10 Clases Flash', desc: 'Oferta limitada', precio: '$100', tipo: 'C' },
  { id: 'prueba_star', nombre: 'Prueba Star', desc: '20 Clases', precio: '$250', tipo: 'C' },
  { id: 'extremo', nombre: 'Extremo', desc: '20 Clases', precio: '$450', tipo: 'C' },
  { id: 'ultimate', nombre: 'Ultimate Pack', desc: '22 Clases', precio: '$500', tipo: 'C' },
  { id: 'membresia_start', nombre: 'Membresía Start', desc: '7 días - Semanal', precio: '$200', tipo: 'M' },
  { id: 'membresia_semanal', nombre: 'Membresía Semanal', desc: '7 días acceso', precio: '$250', tipo: 'M' },
  { id: 'membresia_prueba', nombre: 'Membresía Prueba', desc: '14 días', precio: '$600', tipo: 'M' },
  { id: 'membresia_pro', nombre: 'Membresía Pro', desc: '30 días - Mensual', precio: '$600', tipo: 'M' },
  { id: 'membresia_mensual', nombre: 'Membresía Mensual', desc: '30 días acceso', precio: '$800', tipo: 'M' },
  { id: 'membresia_prueba_celular', nombre: 'Prueba Celular', desc: '30 días', precio: '$800', tipo: 'M' },
  { id: 'membresia_ultimate', nombre: 'Membresía Ultimate', desc: 'Anual - 365 días', precio: '$2,500', tipo: 'M' },
  { id: 'membresia_legendaria', nombre: 'Legendaria', desc: 'Anual - 800 días', precio: '$12,000', tipo: 'M' },
];

export default function MetodosPagoScreen() {
  const { users } = useContext(UserContext);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  
  const appState = useRef(AppState.currentState);
  const sessionEnCurso = useRef<string | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      // Si el usuario vuelve a la app (por ejemplo, cerró el navegador manualmente)
      if (
        appState.current.match(/inactive|background/) && 
        nextAppState === 'active' && 
        sessionEnCurso.current
      ) {
        // Verificamos por si acaso el pago se completó pero el redirect falló
        verificarConReintentos(sessionEnCurso.current!);
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, []);

  const verificarConReintentos = async (sessionId: string, intentos = 0) => {
    setLoadingId('verificando');
    try {
      const res = await verificarPagoStripe(sessionId);
      
      if (res.pagado) {
        Alert.alert("¡Éxito!", "Tu compra en Fixskale se ha procesado correctamente.");
        sessionEnCurso.current = null;
        setLoadingId(null);
      } else if (intentos < 3) {
        // Reintentamos brevemente si el webhook de Stripe aún está procesando
        setTimeout(() => verificarConReintentos(sessionId, intentos + 1), 2500);
      } else {
        Alert.alert("Procesando", "Estamos confirmando tu pago. Tus créditos aparecerán en unos momentos.");
        sessionEnCurso.current = null;
        setLoadingId(null);
      }
    } catch (error) {
      console.error("Error verificando pago:", error);
      setLoadingId(null);
      sessionEnCurso.current = null;
    }
  };

  const iniciarFlujoPago = async (productoId: string) => {
    setLoadingId(productoId);
    try {
      // Importante: El scheme debe ser 'fixskale-app' (con guion si así está en tu app.json)
      // Esto genera fixskale-app://pagofinalizado
      const redirectUrl = Linking.createURL('pagofinalizado', { scheme: 'fixskale-app' });

      const data = await crearSesionCheckout(productoId, users.id, users.gymId, redirectUrl);
      
      if (data?.url && data?.sessionId) {
        sessionEnCurso.current = data.sessionId;

        // openAuthSessionAsync permite que la app reaccione cuando el navegador redirige al scheme
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

        if (result.type === 'success') {
          // El navegador se cerró porque detectó el redirectUrl del backend
          verificarConReintentos(data.sessionId);
        } else {
          // El usuario canceló o cerró el navegador manualmente
          setLoadingId(null);
          sessionEnCurso.current = null;
        }
      } else {
        Alert.alert("Error", "No se pudo generar la sesión de pago.");
        setLoadingId(null);
      }
    } catch (e) {
      console.error("Error en flujo de pago:", e);
      Alert.alert("Error", "Ocurrió un problema al conectar con el servidor de pagos.");
      setLoadingId(null);
    }
  };

  const renderItem = (pkg: typeof PAQUETES[0]) => (
    <TouchableOpacity 
      key={pkg.id} 
      style={styles.card} 
      onPress={() => iniciarFlujoPago(pkg.id)}
      disabled={loadingId !== null}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.pkgName}>{pkg.nombre}</Text>
        <Text style={styles.pkgDesc}>{pkg.desc}</Text>
        <Text style={styles.pkgPrice}>{pkg.precio} MXN</Text>
      </View>
      {loadingId === pkg.id ? (
        <ActivityIndicator color={COLORS.accent} />
      ) : (
        <IconButton icon="cart-outline" iconColor={COLORS.accent} size={22} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={4}>
        <Text style={styles.headerTitle}>TIENDA</Text>
        <Text style={styles.headerSub}>Adquiere tus accesos de forma segura</Text>
      </Surface>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>PAQUETES DE CRÉDITOS</Text>
        {PAQUETES.filter(p => p.tipo === 'C').map(renderItem)}

        <Text style={[styles.sectionTitle, { marginTop: 25 }]}>MEMBRESÍAS</Text>
        {PAQUETES.filter(p => p.tipo === 'M').map(renderItem)}
      </ScrollView>

      {loadingId === 'verificando' && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.overlayText}>Sincronizando con el gimnasio...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingTop: 60,
    paddingBottom: 25,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: COLORS.accent, letterSpacing: 3 },
  headerSub: { color: COLORS.textSub, fontSize: 12, marginTop: 4 },
  scroll: { padding: 20 },
  sectionTitle: { color: COLORS.accent, fontSize: 13, fontWeight: 'bold', marginBottom: 15, opacity: 0.8 },
  card: {
    backgroundColor: COLORS.cardBg,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  pkgName: { color: COLORS.textMain, fontSize: 16, fontWeight: 'bold' },
  pkgDesc: { color: COLORS.textSub, fontSize: 12, marginTop: 2 },
  pkgPrice: { color: COLORS.price, fontSize: 19, fontWeight: 'bold', marginTop: 8 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000
  },
  overlayText: { color: '#fff', marginTop: 15, fontWeight: '500' }
});