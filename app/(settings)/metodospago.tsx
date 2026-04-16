import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// ESENCIAL: El componente debe exportarse como 'default'
export default function MetodosPagoScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Métodos de Pago</Text>
      <Text style={styles.subtitle}>Configura tus opciones de pago aquí.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Fondo negro para tu tema
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: '#39FF14', // Color neón que usas en el proyecto
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
  },
});