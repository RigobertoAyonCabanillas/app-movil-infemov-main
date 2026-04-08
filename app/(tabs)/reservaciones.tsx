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
import { obtenerClasesGimnasio, obtenerMisClases, inscribirAClase, cancelarInscripcion } from '@/services/api';

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

const MAPA_DISCIPLINAS: { [key: number]: string } = {
  1: 'Spinning', 2: 'Yoga', 3: 'Cardio', 4: 'Barre', 5: 'Zumba', 6: 'Zumba',
  7: 'Zumba', 8: 'Gimnasio', 9: 'Gimnasio', 1009: 'CrossFit', 1010: 'Cardio',
  1011: 'Cardio', 1012: 'Spinning', 1013: 'Pilates', 1014: 'Zumba', 2013: 'Ola',
  2014: 'Sdf', 3017: 'Spinning', 3018: 'Box', 3019: 'Spinning', 3020: 'Box', 4019: 'Capoeira'
};

export default function ReservacionesScreen() {
  const { users } = useContext(UserContext);
  const gimnasioId = users?.gymId; 
  const usuarioIdActual = Number(users?.id); 

  const [inicioSemana] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const diasSemana = Array.from({ length: 7 }, (_, i) => addDays(inicioSemana, i));
  
  const [clasesDisponibles, setClasesDisponibles] = useState<Clase[]>([]);
  const [misClasesInscritas, setMisClasesInscritas] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(format(new Date(), 'yyyy-MM-dd'));
  const [modalEquipoVisible, setModalEquipoVisible] = useState(false);
  const [modalGestionVisible, setModalGestionVisible] = useState(false); 
  const [disciplinaSeleccionada, setDisciplinaSeleccionada] = useState('Todas las Clases');
  const [claseSeleccionada, setClaseSeleccionada] = useState<Clase | null>(null); 

  const cargarDatos = async () => {
    if (!gimnasioId) return;
    setLoading(true);
    try {
      const [resClases, resInscripciones] = await Promise.allSettled([
        obtenerClasesGimnasio(gimnasioId),
        obtenerMisClases(usuarioIdActual, gimnasioId)
      ]);

      if (resClases.status === 'fulfilled' && Array.isArray(resClases.value)) {
        setClasesDisponibles(resClases.value.map((item: any) => ({
          id: item.id,
          nombre: MAPA_DISCIPLINAS[item.tipoClase_ID] || item.nombre || 'Clase',
          horaInicio: item.horaIncio || '00:00',
          horaFin: item.horaFin || '00:00',
          coach: item.asistenciaCoach || "Staff",
          dia: item.fecha ? item.fecha.split('T')[0] : '',
          tipoClaseID: item.tipoClase_ID,
          vacantes: item.vacantes || 0,
          lugaresOcupados: item.lugaresOcupados || [],
          esperaUsers: item.esperaUsers || [],
        })));
      }

      if (resInscripciones.status === 'fulfilled' && Array.isArray(resInscripciones.value)) {
        setMisClasesInscritas(resInscripciones.value);
      }
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

    const estoyEnEsperaLista = (clase.esperaUsers || []).some(id => Number(id) === usuarioIdActual);
    
    const inscripcionPropia = misClasesInscritas.find(
      (ins) => Number(ins.clase_ID) === claseIdNum
    );

    if (estoyEnEsperaLista || (inscripcionPropia && (inscripcionPropia.lugar === 0 || inscripcionPropia.lugar === "0"))) {
      return { color: COLORS.espera, label: 'EN ESPERA', tipo: 'ESPERA' };
    }

    if (inscripcionPropia) {
      return { color: COLORS.inscrito, label: 'INSCRITO', tipo: 'INSCRITO' };
    }

    const tengoOtraClaseEsaHora = clasesDisponibles.some(c => {
      const idC = Number(c.id);
      if (idC === claseIdNum) return false;
      const apareceEnListaGral = (c.lugaresOcupados || []).some(id => Number(id) === usuarioIdActual) || 
                                 (c.esperaUsers || []).some(id => Number(id) === usuarioIdActual);
      const apareceEnMisInscripciones = misClasesInscritas.some(ins => Number(ins.clase_ID) === idC);
      return (apareceEnListaGral || apareceEnMisInscripciones) && c.dia === clase.dia && c.horaInicio === clase.horaInicio;
    });

    if (tengoOtraClaseEsaHora) return { color: COLORS.bloqueado, label: 'HORARIO OCUPADO', tipo: 'BLOQUEADO' };
    if (estaLleno) return { color: COLORS.lleno, label: 'LLENO', tipo: 'LLENO' };

    return { color: COLORS.accent, label: 'LIBRE', tipo: 'LIBRE' };
  };

  const obtenerTodasMisReservas = () => {
    const unificadas = [...misClasesInscritas];

    clasesDisponibles.forEach(clase => {
      const enEspera = (clase.esperaUsers || []).some(id => Number(id) === usuarioIdActual);
      const yaEstaEnLista = unificadas.some(ins => Number(ins.clase_ID) === Number(clase.id));

      if (enEspera && !yaEstaEnLista) {
        unificadas.push({
          clase_ID: clase.id,
          lugar: 0,
          esSoloEspera: true 
        });
      }
    });

    return unificadas;
  };

  const ejecutarCancelacion = async (idClase: string | number) => {
    setLoading(true);
    try {
      const resultado = await cancelarInscripcion(idClase);

      setMisClasesInscritas(prev => prev.filter(ins => Number(ins.clase_ID) !== Number(idClase)));
      setClasesDisponibles(prev => prev.map(clase => {
        if (Number(clase.id) === Number(idClase)) {
          return {
            ...clase,
            esperaUsers: (clase.esperaUsers || []).filter(uid => Number(uid) !== usuarioIdActual)
          };
        }
        return clase;
      }));

      Alert.alert("Éxito", resultado.mensaje || "Acción realizada correctamente.");
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo procesar la cancelación. Verifica la BASE_URL.");
    } finally {
      await cargarDatos(); 
      setLoading(false);
    }
  };

  const manejarClickBoton = (clase: Clase) => {
    const estado = obtenerInfoEstado(clase);

    if (estado.tipo === 'INSCRITO' || estado.tipo === 'ESPERA') {
      Alert.alert(
        "Gestionar Reserva",
        `¿Deseas cancelar tu lugar en la clase ${clase.nombre}?`,
        [
          { text: "Mantener mi lugar", style: "cancel" },
          { text: "Sí, Cancelar", style: "destructive", onPress: () => ejecutarCancelacion(clase.id) }
        ]
      );
      return;
    }

    if (estado.tipo === 'LLENO') {
      setClaseSeleccionada(clase);
      Alert.alert("Clase Llena", "¿Deseas anotarte en la lista de espera?", [
        { text: "CANCELAR", style: "cancel" },
        { text: "SÍ, ANOTARME", onPress: () => manejarInscripcionFinal(0) }
      ]);
      return;
    }

    if (estado.tipo === 'BLOQUEADO') {
      Alert.alert("Aviso", "Ya tienes una reservación en este mismo horario.");
      return;
    }

    setClaseSeleccionada(clase);
    setModalEquipoVisible(true);
  };

  const manejarInscripcionFinal = async (lugar: any) => {
    if (!claseSeleccionada) return;
    setModalEquipoVisible(false);
    setLoading(true);
    const idClase = claseSeleccionada.id;
    try {
      await inscribirAClase(idClase, lugar);
      setMisClasesInscritas(prev => [...prev, { clase_ID: idClase, lugar: lugar }]);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      await cargarDatos();
      setLoading(false);
    }
  };

  const obtenerNombreClase = (id: number) => {
    const clase = clasesDisponibles.find(c => Number(c.id) === id);
    return clase ? clase.nombre : "Clase";
  };

  const clasesFiltradas = disciplinaSeleccionada === 'Todas las Clases' 
    ? clasesDisponibles : clasesDisponibles.filter(c => c.nombre === disciplinaSeleccionada);

  return (
    <PaperProvider theme={{...DefaultTheme, colors: {...DefaultTheme.colors, background: COLORS.bg}}}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Portal>
          <Modal visible={modalGestionVisible} onDismiss={() => setModalGestionVisible(false)} contentContainerStyle={styles.modalGestion}>
            <Text style={styles.modalTitle}>MIS RESERVACIONES</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {obtenerTodasMisReservas().length === 0 ? (
                <Text style={{ color: COLORS.textSub, textAlign: 'center', marginVertical: 20 }}>No tienes reservaciones activas.</Text>
              ) : (
                obtenerTodasMisReservas().map((ins, index) => {
                  const esEspera = ins.lugar === 0 || ins.lugar === "0" || ins.esSoloEspera;
                  return (
                    <View key={index} style={styles.itemGestion}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: COLORS.textMain, fontWeight: 'bold' }}>{obtenerNombreClase(Number(ins.clase_ID))}</Text>
                        <Text style={{ color: esEspera ? COLORS.espera : COLORS.inscrito, fontSize: 12 }}>
                          {esEspera ? 'LISTA DE ESPERA' : `INSCRITO - LUGAR: ${ins.lugar}`}
                        </Text>
                      </View>
                      <Button 
                        mode="outlined" 
                        textColor={COLORS.lleno} 
                        onPress={() => { setModalGestionVisible(false); ejecutarCancelacion(ins.clase_ID); }}
                        style={{ borderColor: COLORS.lleno }}
                        labelStyle={{ fontSize: 10 }}
                      >
                        Cancelar
                      </Button>
                    </View>
                  );
                })
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
                            key={num} 
                            disabled={estaOcupado}
                            onPress={() => manejarInscripcionFinal(num)}
                            style={[styles.botonLugar, { backgroundColor: estaOcupado ? COLORS.ocupado : COLORS.accent }]}
                        >
                            <Text style={{ fontWeight: 'bold' }}>{num}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
            <Button onPress={() => setModalEquipoVisible(false)} textColor={COLORS.accent}>Cancelar</Button>
          </Modal>
        </Portal>

        <Surface style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <View style={{ width: 40 }} /> 
            <Text style={styles.headerTitle}>HORARIOS SEMANALES</Text>
            <IconButton 
              icon="calendar-check" 
              iconColor={COLORS.accent} 
              size={28} 
              onPress={() => setModalGestionVisible(true)} 
            />
          </View>
          <Text style={styles.dateRange}>06 de abr - 12 de abr</Text> 
        </Surface>

        {loading ? (
          <ActivityIndicator style={{marginTop: 50}} color={COLORS.accent} size="large" />
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {diasSemana.map((dia) => {
              const fechaID = format(dia, 'yyyy-MM-dd');
              const clasesDelDia = clasesFiltradas.filter(c => c.dia === fechaID);
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
                            {estado.tipo === 'LLENO' && (
                                <View style={styles.floatingQuestion}>
                                    <Text style={styles.questionText}>¿Entrar a lista de espera?</Text>
                                </View>
                            )}
                            <Text style={{ color: estado.color, fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>{estado.label}</Text>
                            <Button 
                              mode="contained" 
                              buttonColor={estado.color} 
                              onPress={() => manejarClickBoton(clase)} 
                              labelStyle={{ fontSize: 11, color: '#000', fontWeight: 'bold' }}
                              style={{ borderRadius: 20, minWidth: 95 }}
                            >
                              {(estado.tipo === 'ESPERA' || estado.tipo === 'INSCRITO') ? 'Cancelar' : (estado.tipo === 'LLENO' ? 'Esperar' : 'Inscribir')}
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
  dateRange: { color: COLORS.accent, fontSize: 12, marginTop: -5, marginBottom: 10 },
  scrollContent: { padding: 15 },
  accordion: { backgroundColor: COLORS.cardBg, marginBottom: 5 },
  listItem: { backgroundColor: '#1e1e1e', marginBottom: 5, borderRadius: 5, paddingVertical: 10 },
  rightContainer: { justifyContent: 'center', alignItems: 'center', minWidth: 110 },
  floatingQuestion: { position: 'absolute', top: -15, width: 140, alignItems: 'center' },
  questionText: { color: COLORS.textSub, fontSize: 9, fontStyle: 'italic', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 4, borderRadius: 4 },
  modalContainer: { backgroundColor: COLORS.cardBg, padding: 20, margin: 20, borderRadius: 10 },
  modalGestion: { backgroundColor: COLORS.cardBg, padding: 20, margin: 20, borderRadius: 15, borderWidth: 1, borderColor: '#333' },
  modalTitle: { color: COLORS.accent, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  filaLugares: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 20 },
  botonLugar: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 5 },
  itemGestion: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#333' }
});