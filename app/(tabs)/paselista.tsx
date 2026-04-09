import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Estructura de ejemplo para las clases de la semana
const CLASES_SEMANA = [
  { id: '1', dia: 'Lunes', hora: '08:00 AM', clase: 'Crossfit Intro', inscritos: 12 },
  { id: '2', dia: 'Martes', hora: '09:00 AM', clase: 'Powerlifting', inscritos: 8 },
  { id: '3', dia: 'Miércoles', hora: '07:00 PM', clase: 'Yoga Flow', inscritos: 15 },
  { id: '4', dia: 'Jueves', hora: '08:00 AM', clase: 'Crossfit Avanzado', inscritos: 10 },
  { id: '5', dia: 'Viernes', hora: '06:00 PM', clase: 'HIIT', inscritos: 20 },
];

export default function PaselistaScreen() {
  const [claseActiva, setClaseActiva] = useState(CLASES_SEMANA[0]);

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Gestión de Asistencias</Text>
      
      {/* Selector de Clases de la Semana */}
      <View style={{ height: 100, marginBottom: 20 }}>
        <FlatList
          horizontal
          data={CLASES_SEMANA}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.cardClase, claseActiva.id === item.id && styles.cardActiva]}
              onPress={() => setClaseActiva(item)}
            >
              <Text style={[styles.diaTexto, claseActiva.id === item.id && styles.textoNegro]}>{item.dia}</Text>
              <Text style={[styles.horaTexto, claseActiva.id === item.id && styles.textoNegro]}>{item.hora}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Tabla de Asistencia */}
      <View style={styles.tablaContainer}>
        <View style={styles.tablaHeader}>
          <Text style={styles.claseDetalle}>{claseActiva.clase}</Text>
          <Text style={styles.claseSubdetalle}>{claseActiva.inscritos} Alumnos inscritos</Text>
        </View>

        <ScrollView style={styles.listaAlumnos}>
          {/* Aquí es donde luego harás el map de tu API */}
          <View style={styles.filaAlumno}>
            <View>
              <Text style={styles.nombreAlumno}>Alumno de Prueba 1</Text>
              <Text style={styles.statusAlumno}>Pendiente</Text>
            </View>
            <TouchableOpacity style={styles.botonCheck}>
              <Ionicons name="checkmark-circle" size={28} color="#39FF14" />
            </TouchableOpacity>
          </View>

          <View style={styles.filaAlumno}>
            <View>
              <Text style={styles.nombreAlumno}>Alumno de Prueba 2</Text>
              <Text style={styles.statusAlumno}>Confirmado</Text>
            </View>
            <Ionicons name="happy" size={28} color="#39FF14" />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
  },
  cardClase: {
    backgroundColor: '#1A1A1A',
    padding: 15,
    borderRadius: 15,
    marginRight: 10,
    width: 110,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  cardActiva: {
    backgroundColor: '#39FF14',
    borderColor: '#39FF14',
  },
  diaTexto: {
    color: '#39FF14',
    fontWeight: 'bold',
    fontSize: 16,
  },
  horaTexto: {
    color: '#AAA',
    fontSize: 12,
  },
  textoNegro: {
    color: '#000',
  },
  tablaContainer: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#222',
  },
  tablaHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 15,
    marginBottom: 10,
  },
  claseDetalle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  claseSubdetalle: {
    color: '#666',
    fontSize: 14,
  },
  listaAlumnos: {
    marginTop: 10,
  },
  filaAlumno: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#222',
  },
  nombreAlumno: {
    color: '#FFF',
    fontSize: 16,
  },
  statusAlumno: {
    color: '#555',
    fontSize: 12,
  },
  botonCheck: {
    padding: 5,
  }
});