import { useFocusEffect } from "expo-router";
import { useContext, useCallback, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { UserContext } from '../../components/UserContext'; 
import { useAuthService } from "@/servicesdb/authService";
import { parse, isBefore } from 'date-fns';

const BRAND_PINK = '#FF3CAC'; 
const BRAND_GREEN = '#39FF14'; 
const CARD_BG = '#0A0A0A'; 

export default function Home() {
  const { users } = useContext(UserContext);
  const { 
    sincronizarPerfil, 
    actualizarBaseDatosLocalMembresia, 
    actualizarBaseDatosLocalCreditos,
    obtenerMisClasesProceso 
  } = useAuthService();

  const [misReservas, setMisReservas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // REF para evitar el bucle infinito
  const isSyncing = useRef(false);

  const cargarInformacionHome = async () => {
    // Evitamos ejecuciones duplicadas si ya hay una en curso
    if (isSyncing.current) return;

    const currentId = users?.id || users?.Id;
    const currentCorreo = users?.correo || users?.Correo;
    const currentGymId = users?.gymId || users?.GimnasioActual;

    if (!currentId || !currentCorreo) return;

    try {
      isSyncing.current = true;
      setLoading(true);

      console.log("🔄 Sincronizando Home...");
      
      // Ejecutamos las promesas
      await sincronizarPerfil(currentId, currentCorreo);
      await actualizarBaseDatosLocalMembresia(currentId, currentGymId);
      await actualizarBaseDatosLocalCreditos(currentId, currentGymId);

      const clases = await obtenerMisClasesProceso(currentId, currentGymId);
      
      const ahora = new Date();
      const clasesFuturas = (clases || []).filter((ins: any) => {
        try {
          const fechaLimpia = (ins.dia || ins.fecha || "").split('T')[0];
          const fechaHoraClase = parse(`${fechaLimpia} ${ins.horaInicio}`, 'yyyy-MM-dd HH:mm:ss', new Date());
          return !isBefore(fechaHoraClase, ahora);
        } catch (e) { return false; }
      });

      setMisReservas(clasesFuturas);
    } catch (e) {
      console.error("❌ Error en sincronización:", e);
    } finally {
      setLoading(false);
      isSyncing.current = false;
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarInformacionHome();
      
      // Opcional: limpiar al salir de la pantalla
      return () => {
        isSyncing.current = false;
      };
    }, []) // Dependencias vacías: solo se ejecuta al entrar a la pantalla
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.welcomeText}>Hola,</Text>
        <Text style={styles.userName}>{users?.nombre || users?.Nombre || "Atleta"}</Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tu Agenda</Text>
        {loading && <ActivityIndicator size="small" color={BRAND_GREEN} />}
      </View>

      {misReservas.length > 0 ? (
        misReservas.map((item, index) => (
          <View key={index} style={styles.reservaCard}>
            <View style={styles.reservaInfo}>
              <Text style={styles.claseNombre}>{item.nombreClase}</Text>
              <Text style={styles.claseDetalle}>{item.dia} | {item.horaInicio}</Text>
            </View>
            <View style={styles.tagLugar}>
              <Text style={styles.tagText}>
                {item.lugar === 0 || item.lugar === "0" ? "ESPERA" : `LUGAR ${item.lugar}`}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No hay clases próximas hoy.</Text>
        </View>
      )}

      {/* BANNER DE RELLENO ESTILO GYM */}
      <View style={styles.promoBanner}>
        <View style={styles.promoBadge}>
          <Text style={styles.promoBadgeText}>NUEVO</Text>
        </View>
        <Text style={styles.promoTitle}>Reto 21 Días: Verano Neón</Text>
        <Text style={styles.promoDesc}>Inscríbete en recepción y gana una playera exclusiva.</Text>
      </View>

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
  contentContainer: { padding: 24, paddingTop: 50, paddingBottom: 100 },
  header: { marginBottom: 35 },
  welcomeText: { color: '#888888', fontSize: 16 },
  userName: { color: BRAND_PINK, fontSize: 32, fontWeight: 'bold' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  sectionTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  reservaCard: { backgroundColor: CARD_BG, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#1A1A1A', marginBottom: 10 },
  reservaInfo: { flex: 1 },
  claseNombre: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  claseDetalle: { color: '#888888', fontSize: 13, marginTop: 4 },
  tagLugar: { backgroundColor: '#000', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: BRAND_GREEN },
  tagText: { color: BRAND_GREEN, fontSize: 10, fontWeight: 'bold' },
  emptyCard: { padding: 20, borderRadius: 14, borderStyle: 'dashed', borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  emptyText: { color: '#666' },
  promoBanner: { backgroundColor: '#111', borderRadius: 16, padding: 20, marginTop: 20, borderWidth: 1, borderColor: '#222' },
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