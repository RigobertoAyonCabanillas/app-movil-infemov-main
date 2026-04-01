import React, { useState, useContext, useCallback } from 'react';
import { View, StyleSheet, ScrollView, StatusBar, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { 
  Text, List, Surface, DefaultTheme, 
  Provider as PaperProvider, Portal, Modal, Chip, Button 
} from 'react-native-paper';
import { format, addDays, startOfWeek } from 'date-fns'; 
import { es } from 'date-fns/locale'; 
import { useFocusEffect } from '@react-navigation/native';

import { UserContext } from '../../components/UserContext'; 
import { obtenerClasesGimnasio, obtenerMisClases, inscribirAClase } from '@/services/api';

interface Clase {
  id: string; 
  nombre: string;
  horaInicio: string;
  horaFin: string;
  coach: string;
  dia: string;
  tipoClaseID: number;
  vacantes: number;
}

const COLORS = {
  bg: '#000000',          
  cardBg: '#121212',      
  accent: '#39FF14',    
  textMain: '#FFFFFF',     
  textSub: '#A0A0A0',      
  inscrito: '#FF8C00',  
  lleno: '#FF0000',     
};

const MAPA_DISCIPLINAS: { [key: number]: string } = {
  1: 'Spinning', 2: 'Yoga', 3: 'Cardio', 4: 'Barre', 5: 'Zumba',
  6: 'Zumba', 7: 'Zumba 2', 8: 'Gimnasio', 9: 'Gimnasio',
  1009: 'CrossFit', 1010: 'Cardio', 1011: 'Cardio', 1012: 'Spinning',
  1013: 'Pilates', 1014: 'Zumba', 2013: 'Ola', 2014: 'Sdf',
  3017: 'Spinning', 3018: 'Box', 3019: 'Spinning', 3020: 'Box', 4019: 'Capoeira'
};

export default function ReservacionesScreen() {
  const { users } = useContext(UserContext);
  const gimnasioId = users?.GimnasioActual; 
  const usuarioId = users?.id || users?.Id || users?.usuario_ID; 

  const [inicioSemana] = useState(() => {
    return startOfWeek(new Date(), { weekStartsOn: 1 });
  });

  const diasSemana = Array.from({ length: 7 }, (_, i) => addDays(inicioSemana, i));
  const [clasesDisponibles, setClasesDisponibles] = useState<Clase[]>([]);
  const [misClasesInscritas, setMisClasesInscritas] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(format(new Date(), 'yyyy-MM-dd'));
  const [modalVisible, setModalVisible] = useState(false);
  const [modalEquipoVisible, setModalEquipoVisible] = useState(false);
  const [disciplinaSeleccionada, setDisciplinaSeleccionada] = useState('Todas las Clases');
  const [claseSeleccionada, setClaseSeleccionada] = useState<Clase | null>(null); 

  const cargarDatos = async () => {
    if (!gimnasioId || !usuarioId) return;
    setLoading(true);
    try {
      const [resClases, resInscripciones] = await Promise.allSettled([
        obtenerClasesGimnasio(gimnasioId),
        obtenerMisClases(usuarioId, gimnasioId)
      ]);
      if (resClases.status === 'fulfilled' && Array.isArray(resClases.value)) {
        const clasesMapeadas: Clase[] = resClases.value.map((item: any) => ({
          id: String(item.id), 
          nombre: MAPA_DISCIPLINAS[item.tipoClase_ID] || 'Clase General', 
          horaInicio: item.horaIncio || '00:00', 
          horaFin: item.horaFin || '00:00',
          coach: item.asistenciaCoach?.trim() || "Staff",
          dia: item.fecha ? item.fecha.split('T')[0] : '', 
          tipoClaseID: item.tipoClase_ID,
          vacantes: item.vacantes ?? 0
        }));
        setClasesDisponibles(clasesMapeadas);
      }
      if (resInscripciones.status === 'fulfilled' && Array.isArray(resInscripciones.value)) {
        setMisClasesInscritas(resInscripciones.value);
      }
    } catch (error) { console.error("Error:", error); } 
    finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { cargarDatos(); }, [gimnasioId, usuarioId]));

  const obtenerInfoEstado = (clase: Clase) => {
    const horaClaseLimpia = clase.horaInicio.trim().substring(0, 5);
    const diaClaseLimpio = clase.dia.trim();
    const inscritoDirecto = misClasesInscritas.some(ins => String(ins.clase_ID) === String(clase.id));
    const tieneChoque = misClasesInscritas.some(ins => {
      const detalleInscrita = clasesDisponibles.find(c => String(c.id) === String(ins.clase_ID));
      return detalleInscrita && detalleInscrita.dia === diaClaseLimpio && detalleInscrita.horaInicio.trim().substring(0, 5) === horaClaseLimpia;
    });

    if (inscritoDirecto || tieneChoque) {
      return { 
        color: COLORS.inscrito, 
        label: inscritoDirecto ? 'INSCRITO' : 'HORARIO OCUPADO', 
        icon: inscritoDirecto ? 'calendar-check' : 'calendar-remove' // Icono actualizado
      };
    }
    if (clase.vacantes <= 0) return { color: COLORS.lleno, label: 'LLENO', icon: 'account-remove' };
    return { color: COLORS.accent, label: 'LIBRE', icon: 'clock-outline' };
  };

  const abrirSeleccionLugar = (clase: Clase) => {
    const estado = obtenerInfoEstado(clase);
    if (estado.color === COLORS.inscrito) {
      Alert.alert("Aviso", "Ya tienes una reservación para este horario.");
      return;
    }
    setClaseSeleccionada(clase);
    setModalEquipoVisible(true);
  };

  const manejarInscripcionFinal = async (lugar: any) => {
    if (!claseSeleccionada) return;
    setModalEquipoVisible(false);
    setLoading(true);
    try {
      await inscribirAClase(claseSeleccionada.id, lugar); 
      Alert.alert("Éxito", "Inscripción confirmada.");
      await cargarDatos(); 
    } catch (error: any) {
      Alert.alert("Aviso", error.message);
      await cargarDatos(); 
    } finally { setLoading(false); }
  };

  const clasesFiltradas = disciplinaSeleccionada === 'Todas las Clases' 
    ? clasesDisponibles : clasesDisponibles.filter(c => c.nombre === disciplinaSeleccionada);

  const disciplinasParaFiltro = ['Todas las Clases', ...new Set(clasesDisponibles.map(c => c.nombre))].sort();

  return (
    <PaperProvider theme={{...DefaultTheme, colors: {...DefaultTheme.colors, background: COLORS.bg}}}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Portal>
          <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modalContainer}>
            <Text style={styles.modalTitle}>FILTRAR DISCIPLINA</Text>
            <ScrollView contentContainerStyle={styles.chipContainer}>
              {disciplinasParaFiltro.map((item) => (
                <Chip
                  key={item}
                  selected={disciplinaSeleccionada === item}
                  onPress={() => { setDisciplinaSeleccionada(item); setModalVisible(false); }}
                  style={[styles.chip, disciplinaSeleccionada === item ? styles.chipActive : styles.chipInactive]}
                  textStyle={{ color: COLORS.textMain, fontSize: 11 }}
                >
                  {item}
                </Chip>
              ))}
            </ScrollView>
            <Button onPress={() => setModalVisible(false)} textColor={COLORS.accent}>Cerrar</Button>
          </Modal>

          <Modal visible={modalEquipoVisible} onDismiss={() => setModalEquipoVisible(false)} contentContainerStyle={styles.modalContainer}>
            <Text style={styles.modalTitle}>SELECCIONA TU LUGAR</Text>
            <ScrollView contentContainerStyle={styles.scrollLugares}>
              {(() => {
                const total = claseSeleccionada?.vacantes || 0;
                const filas = [];
                let i = 0;
                let esFilaDeCuatro = true;
                while (i < total) {
                  const tamFila = esFilaDeCuatro ? 4 : 3;
                  const lugares = Array.from({ length: Math.min(tamFila, total - i) }, (_, idx) => i + idx + 1);
                  filas.push(
                    <View key={`fila-${i}`} style={styles.filaLugares}>
                      {lugares.map((num) => (
                        <TouchableOpacity key={num} style={styles.botonLugar} onPress={() => manejarInscripcionFinal(num)}>
                          <Text style={styles.textoLugar}>{num}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  );
                  i += tamFila;
                  esFilaDeCuatro = !esFilaDeCuatro;
                }
                return filas;
              })()}
            </ScrollView>
            <Button onPress={() => setModalEquipoVisible(false)} textColor={COLORS.accent}>Cancelar</Button>
          </Modal>
        </Portal>

        <Surface style={styles.header}>
          <Text style={styles.headerTitle}>HORARIOS SEMANALES</Text>
          <Button mode="outlined" onPress={() => setModalVisible(true)} style={styles.filterBtn} labelStyle={{ color: COLORS.accent }} icon="filter-variant">
            {disciplinaSeleccionada}
          </Button>
          <Text style={styles.headerSubtitle}>
            {format(inicioSemana, "dd 'de' MMM", { locale: es })} - {format(addDays(inicioSemana, 6), "dd 'de' MMM", { locale: es })}
          </Text>
        </Surface>

        {loading ? (
          <ActivityIndicator style={{marginTop: 50}} color={COLORS.accent} size="large" />
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {diasSemana.map((dia) => {
              const fechaID = format(dia, 'yyyy-MM-dd');
              const clasesDelDia = clasesFiltradas.filter(c => c.dia === fechaID);
              const estaAbierto = expandedId === fechaID;
              return (
                <List.Accordion
                  key={fechaID}
                  title={format(dia, "EEEE d 'de' MMMM", { locale: es })}
                  expanded={estaAbierto}
                  onPress={() => setExpandedId(estaAbierto ? null : fechaID)}
                  titleStyle={{ color: estaAbierto ? COLORS.accent : COLORS.textMain, textTransform: 'capitalize' }}
                  style={styles.accordion}
                  left={props => <List.Icon {...props} icon="calendar-month" color={estaAbierto ? COLORS.accent : COLORS.textSub} />}
                >
                  {clasesDelDia.map((clase) => {
                    const estado = obtenerInfoEstado(clase);
                    return (
                      <List.Item
                        key={clase.id}
                        title={clase.nombre}
                        description={`${clase.horaInicio.substring(0,5)} - ${clase.horaFin.substring(0,5)}\nVacantes: ${clase.vacantes}`}
                        titleStyle={{ color: COLORS.textMain, fontWeight: 'bold' }}
                        descriptionStyle={{ color: COLORS.textSub }}
                        style={[styles.listItem, { borderLeftWidth: 4, borderLeftColor: estado.color }]}
                        left={props => <List.Icon {...props} icon={estado.icon} color={estado.color} />}
                        right={() => (
                          <View style={{ justifyContent: 'center', alignItems: 'flex-end', paddingRight: 5 }}>
                            <Text style={{ color: estado.color, fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>{estado.label}</Text>
                            <Button 
                              compact mode={estado.label === 'LIBRE' ? "contained" : "outlined"}
                              buttonColor={estado.label === 'LIBRE' ? COLORS.accent : 'transparent'}
                              textColor={estado.label === 'LIBRE' ? "#000" : estado.color} 
                              style={{ borderColor: estado.color }}
                              onPress={() => abrirSeleccionLugar(clase)}
                            >
                              {estado.label === 'LIBRE' ? 'Inscribir' : 'Detalles'}
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
  header: { padding: 20, backgroundColor: COLORS.cardBg, alignItems: 'center', borderBottomRightRadius: 20, borderBottomLeftRadius: 20 },
  headerTitle: { color: COLORS.textMain, fontWeight: 'bold', fontSize: 18 },
  headerSubtitle: { color: COLORS.accent, marginTop: 10, fontWeight: 'bold' },
  filterBtn: { marginTop: 10, borderColor: COLORS.accent, width: '80%' },
  scrollContent: { padding: 15 },
  accordion: { backgroundColor: COLORS.cardBg, marginBottom: 8, borderRadius: 10 },
  listItem: { backgroundColor: '#1e1e1e', marginHorizontal: 10, borderRadius: 8, marginBottom: 5 },
  modalContainer: { backgroundColor: COLORS.cardBg, padding: 20, margin: 20, borderRadius: 15, maxHeight: '80%' },
  modalTitle: { color: COLORS.accent, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  chip: { marginBottom: 8 },
  chipActive: { backgroundColor: COLORS.accent },
  chipInactive: { backgroundColor: '#333' },
  scrollLugares: { alignItems: 'center', paddingVertical: 10 },
  filaLugares: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12, width: '100%', gap: 10 },
  botonLugar: { backgroundColor: COLORS.accent, width: 45, height: 45, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  textoLugar: { color: '#000', fontWeight: 'bold', fontSize: 16 }
});