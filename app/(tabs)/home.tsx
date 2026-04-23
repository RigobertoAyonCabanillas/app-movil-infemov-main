import { useFocusEffect, useRouter } from "expo-router";
import { useContext, useCallback, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  StatusBar, 
  ActivityIndicator, 
  TouchableOpacity 
} from 'react-native';
import { UserContext } from '../../components/UserContext'; 
import { useAuthService } from "@/servicesdb/authService";

const BRAND_PINK = '#FF3CAC'; 
const BRAND_GREEN = '#39FF14'; 
const CARD_BG = '#0A0A0A'; 

export default function Home() {
  const { users } = useContext(UserContext);
  const router = useRouter();
  const { 
    sincronizarPerfil, 
    actualizarBaseDatosLocalMembresia, 
    actualizarBaseDatosLocalCreditos,
    obtenerMembresiasLocal,
    obtenerCreditosLocal
  } = useAuthService();

  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const currentId = users?.id || users?.Id;
      const currentGymId = users?.gymId || users?.GimnasioActual;

      if (currentId && currentGymId) {
        const timeout = setTimeout(async () => {
          try {
            setLoading(true);
            await sincronizarPerfil(currentId, users?.correo);
            await actualizarBaseDatosLocalMembresia(currentId, currentGymId);
            await actualizarBaseDatosLocalCreditos(currentId, currentGymId);
          } catch (error) {
            console.error(error);
          } finally {
            setLoading(false);
          }
        }, 500);
        return () => clearTimeout(timeout);
      }
    }, [users?.id, users?.gymId])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <StatusBar barStyle="light-content" />

      {/* Saludo inicial */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Hola,</Text>
        <Text style={styles.userName}>{users?.nombre || "German"}</Text>
      </View>

      {/* APARTADO DE PROMOCIONES - SIEMPRE VISIBLE */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Promociones</Text>
      </View>

      <TouchableOpacity 
        style={styles.promoButton} 
        onPress={() => router.push("/tienda")}
        activeOpacity={0.7}
      >
        <View style={styles.buttonContent}>
          <Text style={styles.buttonTitle}>¡Adquiere tu plan!</Text>
          <Text style={styles.buttonSub}>Visita nuestra tienda y aprovecha las ofertas.</Text>
        </View>
        <View style={styles.arrowContainer}>
          <Text style={styles.arrow}>→</Text>
        </View>
      </TouchableOpacity>

      {/* Tu Agenda */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tu Agenda</Text>
        {loading && <ActivityIndicator size="small" color={BRAND_GREEN} style={{ marginLeft: 10 }} />}
      </View>

      <TouchableOpacity 
        style={styles.agendaButton} 
        onPress={() => router.push("/(tabs)/reservaciones")}
        activeOpacity={0.7}
      >
        <View style={styles.buttonContent}>
          <Text style={styles.buttonTitle}>Ver mis clases</Text>
          <Text style={styles.buttonSub}>Consulta tus horarios y reserva aquí</Text>
        </View>
        <View style={styles.arrowContainer}>
          <Text style={[styles.arrow, { color: BRAND_GREEN }]}>→</Text>
        </View>
      </TouchableOpacity>

      {/* Banner Reto */}
      <View style={styles.promoBanner}>
        <View style={styles.promoBadge}>
          <Text style={styles.promoBadgeText}>NUEVO</Text>
        </View>
        <Text style={styles.promoTitle}>Reto 21 Días: Verano Neón</Text>
        <Text style={styles.promoDesc}>Inscríbete en recepción y gana una playera exclusiva.</Text>
      </View>

      {/* Sección Explora */}
      <Text style={[styles.sectionTitle, { marginTop: 25, marginBottom: 15 }]}>Explora más</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        <View style={[styles.infoBox, { borderColor: BRAND_PINK }]}>
          <Text style={styles.infoTag}>TIP NUTRICIÓN</Text>
          <Text style={styles.infoTitle}>La hidratación es clave</Text>
          <Text style={styles.infoText}>Beber agua mejora tu rendimiento un 15%.</Text>
        </View>

        <View style={[styles.infoBox, { borderColor: BRAND_GREEN }]}>
          <Text style={styles.infoTag}>TIENDA</Text>
          <Text style={styles.infoTitle}>Proteína -20%</Text>
          <Text style={styles.infoText}>Válido en suplementos seleccionados.</Text>
        </View>
      </ScrollView>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  contentContainer: { padding: 24, paddingTop: 50, paddingBottom: 120 },
  header: { marginBottom: 30 },
  welcomeText: { color: '#888888', fontSize: 16 },
  userName: { color: BRAND_PINK, fontSize: 32, fontWeight: 'bold' },
  
  sectionHeader: { marginBottom: 15, flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },

  promoButton: { 
    backgroundColor: CARD_BG, 
    borderRadius: 16, 
    padding: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    borderWidth: 1, 
    borderColor: BRAND_PINK,
    marginBottom: 25
  },

  agendaButton: { 
    backgroundColor: CARD_BG, 
    borderRadius: 16, 
    padding: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    borderWidth: 1, 
    borderColor: '#1A1A1A'
  },

  buttonContent: { flex: 1, justifyContent: 'center' },
  buttonTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  buttonSub: { color: '#666', fontSize: 13, marginTop: 4 },
  
  arrowContainer: { 
    backgroundColor: '#111', 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#222',
    marginLeft: 15
  },
  arrow: { 
    color: BRAND_PINK, 
    fontSize: 24, 
    fontWeight: 'bold', 
    textAlign: 'center',
    lineHeight: 28 
  },

  promoBanner: { backgroundColor: '#111', borderRadius: 16, padding: 20, marginTop: 25, borderWidth: 1, borderColor: '#222' },
  promoBadge: { backgroundColor: BRAND_PINK, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginBottom: 10 },
  promoBadgeText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  promoTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  promoDesc: { color: '#AAA', fontSize: 13, marginTop: 5 },

  horizontalScroll: { marginHorizontal: -24, paddingLeft: 24 },
  infoBox: { width: 200, backgroundColor: CARD_BG, borderRadius: 14, padding: 15, marginRight: 15, borderTopWidth: 3 },
  infoTag: { color: '#555', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  infoTitle: { color: '#EEE', fontSize: 15, fontWeight: 'bold' },
  infoText: { color: '#777', fontSize: 12, marginTop: 5 },
});