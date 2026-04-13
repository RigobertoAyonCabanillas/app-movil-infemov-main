import { useFocusEffect } from "expo-router";
import { useContext, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { UserContext } from '../../components/UserContext'; 

// Importamos el servicio de sincronización
import { useAuthService } from "@/servicesdb/authService";

export default function Home() {
  const { users } = useContext(UserContext);
  const { sincronizarPerfil } = useAuthService();

  // Mantenemos tu lógica intacta para el manejo de sesión
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

      {/* Saludo simple: Usa el nombre del contexto si existe, si no, "Atleta" */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Bienvenido de vuelta,</Text>
        <Text style={styles.userName}>
          {users?.nombre || users?.Nombre || "Atleta"}
        </Text>
      </View>

      {/* Tarjeta de estado: Información general que no satura */}
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

      {/* Sección de avisos generales */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Novedades del Centro</Text>
      </View>

      <View style={styles.newsItem}>
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
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  mainCard: {
    backgroundColor: '#111111',
    borderRadius: 16,
    flexDirection: 'row',
    marginBottom: 45,
    borderWidth: 1,
    borderColor: '#222222',
    overflow: 'hidden',
  },
  accentLine: {
    width: 4,
    backgroundColor: '#39FF14',
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    color: '#39FF14',
    fontSize: 10,
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
    color: '#666666',
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
    backgroundColor: '#0A0A0A',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  newsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00FFFF',
    marginRight: 15,
  },
  newsTextMain: {
    color: '#EEEEEE',
    fontSize: 14,
    fontWeight: '600',
  },
  newsTextSub: {
    color: '#555555',
    fontSize: 12,
    marginTop: 2,
  },
});