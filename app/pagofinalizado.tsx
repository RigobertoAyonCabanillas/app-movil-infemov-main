import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PagoFinalizado() {
  const { session_id } = useLocalSearchParams();
  const router = useRouter();

  const irAMetodosPago = () => {
    // Al estar en la raíz, usamos la ruta completa para volver a settings
    router.replace('/(settings)/metodospago');
  };

  return (
    <View style={styles.container}>
      <Ionicons name="checkmark-done-circle" size={120} color="#39FF14" />
      
      <Text style={styles.title}>¡Transacción Exitosa!</Text>
      
      <Text style={styles.message}>
        Tu pago ha sido procesado. Los cambios se verán reflejados en tu cuenta en unos instantes.
      </Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>Sesión: {session_id?.toString().substring(0, 20)}...</Text>
      </View>

      <TouchableOpacity 
        style={styles.button} 
        onPress={irAMetodosPago}
      >
        <Text style={styles.buttonText}>Regresar a Métodos de Pago</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Manteniendo tu estilo oscuro
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 15,
  },
  message: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginVertical: 20,
    lineHeight: 22,
  },
  infoBox: {
    backgroundColor: '#1a1a1a',
    padding: 10,
    borderRadius: 8,
    marginBottom: 30,
  },
  infoText: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#39FF14',
    paddingVertical: 16,
    paddingHorizontal: 35,
    borderRadius: 12,
    elevation: 5,
  },
  buttonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
});