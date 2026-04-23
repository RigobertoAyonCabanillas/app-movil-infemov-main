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
import { useAuthService } from '@/servicesdb/authService'; 

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
  const [tabActivo, setTabActivo] = useState<'C' | 'M'>('C');
  const [tieneMembresiaActiva, setTieneMembresiaActiva] = useState(false);
  
  // Implementación del Hook de SQLite
  const { obtenerMembresiasLocal, actualizarBaseDatosLocalMembresia } = useAuthService();
  
  const appState = useRef(AppState.currentState);
  const sessionEnCurso = useRef<string | null>(null);

  // 1. Efecto inicial para cargar estado desde SQLite
  useEffect(() => {
    checkMembresiaLocal();
  }, [users.id]);

  const checkMembresiaLocal = async () => {
    if (!users.id) return;
    try {
      const locales = await obtenerMembresiasLocal(users.id);
      // Validamos si algún registro tiene estatus 1 (Activo)
      const activa = locales.some((m: any) => m.estatus === 1);
      setTieneMembresiaActiva(activa);
    } catch (e) {
      console.error("❌ Error al verificar membresía local:", e);
    }
  };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active' && sessionEnCurso.current) {
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
        // --- SINCRONIZACIÓN POST-PAGO ---
        // 1. Forzamos la actualización de la API a SQLite
        await actualizarBaseDatosLocalMembresia(users.id, users.gymId);
        // 2. Refrescamos el estado visual
        await checkMembresiaLocal();
        
        Alert.alert("¡Listo!", "Tu compra se ha procesado correctamente.");
        sessionEnCurso.current = null;
        setLoadingId(null);
      } else if (intentos < 2) {
        setTimeout(() => verificarConReintentos(sessionId, intentos + 1), 2500);
      } else {
        sessionEnCurso.current = null;
        setLoadingId(null);
      }
    } catch (error) {
      setLoadingId(null);
      sessionEnCurso.current = null;
    }
  };

  const iniciarFlujoPago = async (productoId: string) => {
    setLoadingId(productoId);
    try {
      const redirectUrl = Linking.createURL('pagofinalizado', { scheme: 'fixskale-app' });
      const data = await crearSesionCheckout(productoId, users.id, users.gymId, redirectUrl);
      
      if (data?.url && data?.sessionId) {
        sessionEnCurso.current = data.sessionId;
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

        if (result.type === 'success') {
          verificarConReintentos(data.sessionId);
        } else {
          setLoadingId(null);
          sessionEnCurso.current = null;
        }
      } else {
        Alert.alert("Error", "No se pudo generar la sesión de pago.");
        setLoadingId(null);
      }
    } catch (e) {
      Alert.alert("Error", "Ocurrió un problema al conectar con el servidor.");
      setLoadingId(null);
    }
  };

  const renderItem = (pkg: typeof PAQUETES[0]) => {
    const estaBloqueado = pkg.tipo === 'M' && tieneMembresiaActiva;

    return (
      <TouchableOpacity 
        key={pkg.id} 
        style={[styles.card, estaBloqueado && styles.cardDisabled]} 
        onPress={() => {
          if (estaBloqueado) {
            Alert.alert("Membresía Activa", "Ya cuentas con una membresía vigente en este momento.");
            return;
          }
          iniciarFlujoPago(pkg.id);
        }}
        disabled={loadingId !== null}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.pkgName}>{pkg.nombre}</Text>
          <Text style={styles.pkgDesc}>
            {estaBloqueado ? "Plan actualmente activo" : pkg.desc}
          </Text>
          <Text style={styles.pkgPrice}>{pkg.precio} MXN</Text>
        </View>
        
        {loadingId === pkg.id ? (
          <ActivityIndicator color={COLORS.accent} />
        ) : (
          <View style={[styles.buyBtn, estaBloqueado && styles.buyBtnDisabled]}>
             <IconButton 
               icon={estaBloqueado ? "lock-outline" : "cart-outline"} 
               iconColor="#000" 
               size={20} 
             />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={0}>
        <Text style={styles.headerTitle}>TIENDA</Text>
        
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, tabActivo === 'C' && styles.tabActivo]}
            onPress={() => setTabActivo('C')}
          >
            <Text style={[styles.tabText, tabActivo === 'C' && styles.tabTextActivo]}>Paquetes</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, tabActivo === 'M' && styles.tabActivo]}
            onPress={() => setTabActivo('M')}
          >
            <Text style={[styles.tabText, tabActivo === 'M' && styles.tabTextActivo]}>Membresías</Text>
          </TouchableOpacity>
        </View>
      </Surface>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>
          {tabActivo === 'C' ? 'COMPRAR CRÉDITOS' : 'MEMBRESÍAS DISPONIBLES'}
        </Text>
        
        {PAQUETES
          .filter(p => p.tipo === tabActivo)
          .map(renderItem)}
      </ScrollView>

      {loadingId === 'verificando' && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.overlayText}>Sincronizando beneficios...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', letterSpacing: 4, marginBottom: 20 },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 25,
    padding: 4,
    width: width * 0.85,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 21,
  },
  tabActivo: {
    backgroundColor: COLORS.accent,
  },
  tabText: { color: COLORS.textSub, fontWeight: 'bold', fontSize: 13 },
  tabTextActivo: { color: '#000' },
  scroll: { padding: 20 },
  sectionTitle: { color: '#444', fontSize: 11, fontWeight: 'bold', marginBottom: 20, letterSpacing: 1 },
  card: {
    backgroundColor: COLORS.cardBg,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardDisabled: {
    opacity: 0.5,
    borderColor: '#111',
  },
  pkgName: { color: COLORS.textMain, fontSize: 16, fontWeight: 'bold' },
  pkgDesc: { color: COLORS.textSub, fontSize: 12, marginTop: 2 },
  pkgPrice: { color: COLORS.price, fontSize: 19, fontWeight: 'bold', marginTop: 8 },
  buyBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyBtnDisabled: {
    backgroundColor: '#444',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000
  },
  overlayText: { color: COLORS.accent, marginTop: 15, fontWeight: 'bold', letterSpacing: 1 }
});