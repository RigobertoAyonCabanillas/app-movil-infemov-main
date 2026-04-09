import React, { useState, useContext, useCallback } from 'react';
import { View, StyleSheet, ScrollView, StatusBar, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { 
  Text, List, Surface, DefaultTheme, 
  Provider as PaperProvider, Portal, Modal, Button, IconButton 
} from 'react-native-paper';
import { format, addDays, startOfWeek } from 'date-fns'; 
import { es } from 'date-fns/locale'; 
import { useFocusEffect } from '@react-navigation/native';

import { UserContext } from '../../components/UserContext'; 
// Importamos el hook que contiene toda la lógica de Drizzle y API
import { useAuthService } from '@/servicesdb/authService';

interface Clase {
  id: string | number; 
  nombre: string;
  horaInicio: string;
  horaFin: string;
  coach: string;
  dia: string;
  tipoClaseID: number;
  vacantes: number;
  lugaresOcupados: number[]; 
  esperaUsers: number[]; 
}

const COLORS = {
  bg: '#000000',           
  cardBg: '#121212',       
  accent: '#39FF14',    
  textMain: '#FFFFFF',     
  textSub: '#A0A0A0',      
  inscrito: '#FF8C00',  
  lleno: '#FF0000',     
  espera: '#FFD700', 
  ocupado: '#FF4500', 
  bloqueado: '#a39191', 
};

export default function ReservacionesScreen() {
  const { users } = useContext(UserContext);
  const gimnasioId = Number(users?.gymId); 
  const usuarioIdActual = Number(users?.id); 

  // --- LLAMADA AL HOOK PERSONALIZADO ---
  // Extraemos las funciones que retornas en tu useAuthService
  const { 
    sincronizarClasesGimnasio, 
    inscribirAClaseProceso, 
    cancelarInscripcionProceso, 
    obtenerMisClasesProceso 
  } = useAuthService();

  const [inicioSemana] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const diasSemana = Array.from({ length: 7 }, (_, i) => addDays(inicioSemana, i));
  
  const [clasesDisponibles, setClasesDisponibles] = useState<Clase[]>([]);
  const [misClasesInscritas, setMisClasesInscritas] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(format(new Date(), 'yyyy-MM-dd'));
  const [modalEquipoVisible, setModalEquipoVisible] = useState(false);
  const [modalGestionVisible, setModalGestionVisible] = useState(false); 
  const [claseSeleccionada, setClaseSeleccionada] = useState<Clase | null>(null); 

  const cargarDatos = async () => {
    if (!gimnasioId || !usuarioIdActual) return;
    setLoading(true);
    try {
      // 1. Sincronizamos usando el proceso del hook
      const datosLocales = await sincronizarClasesGimnasio(gimnasioId, usuarioIdActual);

      // 2. Mapeamos los resultados de SQLite (Drizzle) al estado
      const formateadas: Clase[] = datosLocales.map((item: any) => ({
        id: item.claseId, 
        nombre: item.nombreClase,
        horaInicio: item.horaInicio,
        horaFin: item.horaFin,
        coach: item.coach,
        dia: item.fecha,
        tipoClaseID: item.tipoClaseID,
        vacantes: item.vacantes,
        // Parseamos los JSON que guardaste en SQLite
        lugaresOcupados: JSON.parse(item.lugaresOcupados || '[]'),
        esperaUsers: JSON.parse(item.esperaUsers || '[]'),
      }));

      setClasesDisponibles(formateadas);

      // 3. Obtenemos mis reservas activas
      const inscripciones = await obtenerMisClasesProceso(usuarioIdActual, gimnasioId);
      setMisClasesInscritas(inscripciones);

    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useFocusEffect(useCallback(() => { cargarDatos(); }, [gimnasioId]));

  const obtenerInfoEstado = (clase: Clase) => {
    const claseIdNum = Number(clase.id);
    const totalOcupados = (clase.lugaresOcupados || []).length;
    const estaLleno = totalOcupados >= clase.vacantes;
    const estoyEnEspera = (clase.esperaUsers || []).some(id => Number(id) === usuarioIdActual);
    
    const inscripcionPropia = misClasesInscritas.find(
      (ins) => Number(ins.id || ins.claseId || ins.clase_ID) === claseIdNum
    );

    if (estoyEnEspera || (inscripcionPropia && (inscripcionPropia.lugar === 0 || inscripcionPropia.lugar === "0"))) {
      return { color: COLORS.espera, label: 'EN ESPERA', tipo: 'ESPERA' };
    }
    if (inscripcionPropia) {
      return { color: COLORS.inscrito, label: 'INSCRITO', tipo: 'INSCRITO' };
    }
    const choqueHorario = clasesDisponibles.some(c => {
        if (Number(c.id) === claseIdNum) return false;
        const yaInscritoEnOtra = misClasesInscritas.some(ins => Number(ins.id || ins.claseId || ins.clase_ID) === Number(c.id));
        return yaInscritoEnOtra && c.dia === clase.dia && c.horaInicio === clase.horaInicio;
    });

    if (choqueHorario) return { color: COLORS.bloqueado, label: 'HORARIO OCUPADO', tipo: 'BLOQUEADO' };
    if (estaLleno) return { color: COLORS.lleno, label: 'LLENO', tipo: 'LLENO' };
    return { color: COLORS.accent, label: 'LIBRE', tipo: 'LIBRE' };
  };

  const ejecutarCancelacion = async (idClase: string | number) => {
    setLoading(true);
    try {
      await cancelarInscripcionProceso(idClase);
      Alert.alert("Éxito", "Cancelación realizada.");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      await cargarDatos(); 
      setLoading(false);
    }
  };

  const manejarInscripcionFinal = async (lugar: any) => {
    if (!claseSeleccionada) return;
    setModalEquipoVisible(false);
    setLoading(true);
    try {
      await inscribirAClaseProceso(claseSeleccionada.id, lugar, usuarioIdActual);
      Alert.alert("Éxito", "Inscripción completada.");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      await cargarDatos();
      setLoading(false);
    }
  };

  const manejarClickBoton = (clase: Clase) => {
    const estado = obtenerInfoEstado(clase);
    if (estado.tipo === 'INSCRITO' || estado.tipo === 'ESPERA') {
      Alert.alert("Gestión", "¿Cancelar lugar?", [
        { text: "No" }, { text: "Sí", onPress: () => ejecutarCancelacion(clase.id) }
      ]);
    } else if (estado.tipo === 'LLENO') {
      setClaseSeleccionada(clase);
      Alert.alert("Lleno", "¿Entrar a lista de espera?", [
        { text: "No" }, { text: "Sí", onPress: () => manejarInscripcionFinal(0) }
      ]);
    } else if (estado.tipo === 'LIBRE') {
      setClaseSeleccionada(clase);
      setModalEquipoVisible(true);
    }
  };

  return (
    <PaperProvider theme={{...DefaultTheme, colors: {...DefaultTheme.colors, background: COLORS.bg}}}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Portal>
          <Modal visible={modalGestionVisible} onDismiss={() => setModalGestionVisible(false)} contentContainerStyle={styles.modalGestion}>
            <Text style={styles.modalTitle}>MIS RESERVACIONES</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {misClasesInscritas.length === 0 ? (
                <Text style={{ color: COLORS.textSub, textAlign: 'center', marginVertical: 20 }}>Sin reservaciones.</Text>
              ) : (
                misClasesInscritas.map((ins, index) => (
                  <View key={index} style={styles.itemGestion}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: COLORS.textMain, fontWeight: 'bold' }}>{ins.nombreClase || 'Clase'}</Text>
                      <Text style={{ color: (ins.lugar === 0 || ins.lugar === "0") ? COLORS.espera : COLORS.inscrito, fontSize: 12 }}>
                        {(ins.lugar === 0 || ins.lugar === "0") ? 'LISTA DE ESPERA' : `LUGAR: ${ins.lugar}`}
                      </Text>
                    </View>
                    <Button textColor={COLORS.lleno} onPress={() => { setModalGestionVisible(false); ejecutarCancelacion(ins.claseId || ins.id || ins.clase_ID); }}>
                        Cancelar
                    </Button>
                  </View>
                ))
              )}
            </ScrollView>
            <Button onPress={() => setModalGestionVisible(false)} textColor={COLORS.accent}>Cerrar</Button>
          </Modal>

          <Modal visible={modalEquipoVisible} onDismiss={() => setModalEquipoVisible(false)} contentContainerStyle={styles.modalContainer}>
            <Text style={styles.modalTitle}>SELECCIONA TU LUGAR</Text>
            <View style={styles.filaLugares}>
                {Array.from({ length: claseSeleccionada?.vacantes || 0 }, (_, i) => i + 1).map(num => {
                    const estaOcupado = (claseSeleccionada?.lugaresOcupados || []).includes(num);
                    return (
                        <TouchableOpacity 
                            key={num} disabled={estaOcupado}
                            onPress={() => manejarInscripcionFinal(num)}
                            style={[styles.botonLugar, { backgroundColor: estaOcupado ? COLORS.ocupado : COLORS.accent }]}
                        >
                            <Text style={{ fontWeight: 'bold' }}>{num}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
            <Button onPress={() => setModalEquipoVisible(false)} textColor={COLORS.accent}>Cerrar</Button>
          </Modal>
        </Portal>

        <Surface style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <View style={{ width: 40 }} />
            <Text style={styles.headerTitle}>HORARIOS SEMANALES</Text>
            <IconButton icon="calendar-check" iconColor={COLORS.accent} size={28} onPress={() => setModalGestionVisible(true)} />
          </View>
        </Surface>

        {loading ? (
          <ActivityIndicator style={{marginTop: 50}} color={COLORS.accent} size="large" />
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {diasSemana.map((dia) => {
              const fechaID = format(dia, 'yyyy-MM-dd');
              const clasesDelDia = clasesDisponibles.filter(c => c.dia === fechaID);
              return (
                <List.Accordion
                  key={fechaID}
                  title={format(dia, "EEEE d 'De' MMMM", { locale: es })}
                  expanded={expandedId === fechaID}
                  onPress={() => setExpandedId(expandedId === fechaID ? null : fechaID)}
                  style={styles.accordion}
                  titleStyle={{ color: COLORS.textMain, textTransform: 'capitalize' }}
                >
                  {clasesDelDia.map((clase) => {
                    const estado = obtenerInfoEstado(clase);
                    return (
                      <List.Item
                        key={clase.id}
                        title={clase.nombre}
                        description={`${clase.horaInicio} - ${clase.horaFin}\nVacantes: ${clase.vacantes}`}
                        titleStyle={{ color: COLORS.textMain, fontWeight: 'bold' }}
                        descriptionStyle={{ color: COLORS.textSub }}
                        style={[styles.listItem, { borderLeftWidth: 4, borderLeftColor: estado.color }]}
                        right={() => (
                          <View style={styles.rightContainer}>
                            <Text style={{ color: estado.color, fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>{estado.label}</Text>
                            <Button 
                              mode="contained" buttonColor={estado.color} onPress={() => manejarClickBoton(clase)} 
                              labelStyle={{ fontSize: 11, color: '#000', fontWeight: 'bold' }}
                              style={{ borderRadius: 20, minWidth: 95 }}
                            >
                              {(estado.tipo === 'ESPERA' || estado.tipo === 'INSCRITO') ? 'Cancelar' : (estado.tipo === 'LLENO' ? 'Esperar?' : 'Inscribir')}
                            </Button>
                          </View>
                        )}
                      />
                    );
                  })}
                </List.Accordion>
              );
            })}
          </ScrollView>
        )}
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: COLORS.cardBg, alignItems: 'center' },
  headerTitle: { color: COLORS.textMain, fontWeight: 'bold', fontSize: 18 },
  scrollContent: { padding: 15 },
  accordion: { backgroundColor: COLORS.cardBg, marginBottom: 5 },
  listItem: { backgroundColor: '#1e1e1e', marginBottom: 5, borderRadius: 5, paddingVertical: 10 },
  rightContainer: { justifyContent: 'center', alignItems: 'center', minWidth: 110 },
  modalContainer: { backgroundColor: COLORS.cardBg, padding: 20, margin: 20, borderRadius: 10 },
  modalGestion: { backgroundColor: COLORS.cardBg, padding: 20, margin: 20, borderRadius: 15 },
  modalTitle: { color: COLORS.accent, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  filaLugares: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 20 },
  botonLugar: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 5 },
  itemGestion: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#333' }
});