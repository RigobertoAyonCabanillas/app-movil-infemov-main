import { useFocusEffect } from "expo-router";
import { useContext, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { UserContext } from '../../components/UserContext'; 

// Importamos el servicio de sincronización
import { useAuthService } from "@/servicesdb/authService";

// Colores unificados de la marca
const BRAND_PINK = '#FF3CAC'; 
const BRAND_GREEN = '#39FF14'; 
const CARD_BG = '#0A0A0A'; // Fondo ligeramente más claro que el negro absoluto

export default function Home() {
  const { users } = useContext(UserContext);
  const { sincronizarPerfil } = useAuthService();

  useFocusEffect(
    useCallback(() => {
      const currentId = users?.id || users?.Id;
      const currentCorreo = users?.correo || users?.Correo;

      if (currentId && currentCorreo && !users?.rol) {
        console.log("🚀 Sincronización automática en Home detectada...");
        sincronizarPerfil(currentId, currentCorreo)
          .then(() => {
            console.log("✅ Perfil actualizado");
          })
          .catch((error) => {
            console.error("❌ Error en sincronización inicial:", error);
          });
      }
    }, [users])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <StatusBar barStyle="light-content" />

      {/* Saludo: Ahora el nombre utiliza el Rosa Neón para resaltar */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Bienvenido de vuelta,</Text>
        <Text style={styles.userName}>
          {users?.nombre || users?.Nombre || "Atleta"}
        </Text>
      </View>

      {/* Tarjeta de estado: Mantiene el Verde para indicar que "todo está bien" */}
      <View style={styles.mainCard}>
        <View style={styles.accentLine} />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>RESUMEN DE HOY</Text>
          <Text style={styles.cardStatus}>Todo listo para entrenar</Text>
          <Text style={styles.cardDetail}>
            {users?.rol === 'Coach' ? 'Revisa tus clases asignadas' : 'No tienes reservaciones pendientes'}
          </Text>
        </View>
      </View>

      {/* Sección de avisos */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Novedades del Centro</Text>
      </View>

      <View style={styles.newsItem}>
        {/* El punto de noticia ahora es Rosa para captar la atención */}
        <View style={styles.newsDot} />
        <View>
          <Text style={styles.newsTextMain}>Horarios Actualizados</Text>
          <Text style={styles.newsTextSub}>Consulta la pestaña de reservaciones para ver cambios.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  contentContainer: {
    padding: 24,
    paddingTop: 50,
  },
  header: {
    marginBottom: 35,
  },
  welcomeText: {
    color: '#888888',
    fontSize: 16,
    marginBottom: 4,
  },
  userName: {
    color: BRAND_PINK, // Nombre resaltado en Rosa
    fontSize: 32,
    fontWeight: 'bold',
    textShadowColor: 'rgba(255, 60, 172, 0.3)',
    textShadowRadius: 8,
  },
  mainCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    flexDirection: 'row',
    marginBottom: 45,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    overflow: 'hidden',
    // Sutil brillo verde en la tarjeta
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  accentLine: {
    width: 5,
    backgroundColor: BRAND_GREEN, // Línea de estado en Verde
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    color: BRAND_GREEN,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  cardStatus: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardDetail: {
    color: '#888888',
    fontSize: 13,
    marginTop: 4,
  },
  sectionHeader: {
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  newsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    padding: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  newsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND_PINK, // Notificación en Rosa
    marginRight: 15,
    shadowColor: BRAND_PINK,
    shadowRadius: 4,
    elevation: 2,
  },
  newsTextMain: {
    color: '#EEEEEE',
    fontSize: 14,
    fontWeight: '600',
  },
  newsTextSub: {
    color: '#666666',
    fontSize: 12,
    marginTop: 2,
  },
});