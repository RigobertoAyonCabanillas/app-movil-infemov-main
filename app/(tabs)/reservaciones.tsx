import React, { useState, useContext, useCallback } from 'react';
import { View, StyleSheet, ScrollView, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { 
  Text, List, Surface, DefaultTheme, 
  Provider as PaperProvider, Portal, Modal, Chip, Button 
} from 'react-native-paper';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale'; 
import { useFocusEffect } from '@react-navigation/native';

import { UserContext } from '../../components/UserContext'; 
// Asegúrate de que obtenerMisClases e inscribirAClase estén exportados en tu api.js
import { obtenerClasesGimnasio, obtenerMisClases, inscribirAClase } from '@/services/api';
import moment from 'moment-timezone';

interface Clase {
  id: string;
  nombre: string;
  horaInicio: string;
  horaFin: string;
  coach: string;
  dia: string;
  tipoClaseID: number;
  vacantes: number; // Agregado para el estado Rojo
}

const COLORS = {
  bg: '#000000',          
  cardBg: '#121212',      
  accent: '#39FF14', // Verde (Disponible)
  textMain: '#FFFFFF',     
  textSub: '#A0A0A0',      
  inscrito: '#FF8C00', // Naranja (Inscrito)
  lleno: '#FF0000',    // Rojo (Lleno)
};

const MAPA_DISCIPLINAS: { [key: number]: string } = {
  1: 'Spinning', 2: 'Yoga', 3: 'Cardio', 4: 'Barre', 5: 'zumba', 
  6: 'zumba', 7: 'zumba2', 8: 'Gimnasio', 9: 'Gimnasio', 
  1009: 'CrossFit', 1010: 'Cardio', 1011: 'Cardio', 1012: 'Spinning', 
  1013: 'Pilates', 1014: 'Zumba', 2013: 'ola', 2014: 'sdf', 
  3017: 'Spining', 3018: 'Box', 3019: 'Spining', 3020: 'Box', 4019: 'capoeira'
};

export default function ReservacionesScreen() {
  const { users } = useContext(UserContext);
  const gimnasioId = users?.GimnasioActual;
  const superUsuarioId = users?.id;

  const [inicioSemana] = useState(() => {
    const hoy = moment().tz("America/Mexico_City").startOf('day');
    if (hoy.day() === 0) return hoy.clone().subtract(6, 'days').toDate();
    return hoy.clone().startOf('isoWeek').toDate();
  });

  const diasSemana = Array.from({ length: 7 }, (_, i) => addDays(inicioSemana, i));

  const [clasesDisponibles, setClasesDisponibles] = useState<Clase[]>([]);
  const [misClasesIds, setMisClasesIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(format(new Date(), 'yyyy-MM-dd'));
  const [modalVisible, setModalVisible] = useState(false);
  const [disciplinaSeleccionada, setDisciplinaSeleccionada] = useState('Todas las Clases');

  const disciplinasParaFiltro = [
    'Todas las Clases', 
    ...new Set(clasesDisponibles.map(c => c.nombre))
  ].sort();

  const cargarDatos = async () => {
    if (!gimnasioId) return;
    setLoading(true);
    try {
      // Intentamos ambos fetch, pero manejamos errores por separado para que no se bloqueen
      const [data, inscripciones] = await Promise.allSettled([
        obtenerClasesGimnasio(gimnasioId),
        superUsuarioId ? obtenerMisClases(superUsuarioId) : Promise.resolve([])
      ]);

      // Procesar Clases del Gimnasio
      if (data.status === 'fulfilled' && Array.isArray(data.value)) {
        const clasesMapeadas: Clase[] = data.value.map((item: any) => ({
          id: item.id?.toString(),
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

      // Procesar Mis Inscripciones
      if (inscripciones.status === 'fulfilled' && Array.isArray(inscripciones.value)) {
        setMisClasesIds(inscripciones.value.map((c: any) => c.claseId || c.id));
      }

    } catch (error) {
      console.error("Error cargando clases:", error);
    } finally {
      setLoading(false);
    }
  };

  const manejarInscripcion = async (claseId: string) => {
    try {
      await inscribirAClase(claseId, superUsuarioId);
      Alert.alert("Éxito", "Te has inscrito correctamente.");
      cargarDatos(); 
    } catch (error: any) {
      Alert.alert("Aviso", error.message);
    }
  };

  useFocusEffect(useCallback(() => { cargarDatos(); }, [gimnasioId]));

  const obtenerInfoEstado = (clase: Clase) => {
    const inscrito = misClasesIds.includes(Number(clase.id));
    const lleno = clase.vacantes <= 0;

    if (inscrito) return { color: COLORS.inscrito, label: 'INSCRITO', icon: 'check-decagram' };
    if (lleno) return { color: COLORS.lleno, label: 'LLENO', icon: 'account-remove' };
    return { color: COLORS.accent, label: 'LIBRE', icon: 'clock-outline' };
  };

  const clasesFiltradas = disciplinaSeleccionada === 'Todas las Clases' 
    ? clasesDisponibles 
    : clasesDisponibles.filter(c => c.nombre === disciplinaSeleccionada);

  return (
    <PaperProvider theme={{...DefaultTheme, colors: {...DefaultTheme.colors, background: COLORS.bg}}}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        <Portal>
          <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modalContainer}>
            <Text style={styles.modalTitle}>SELECCIONAR DISCIPLINA</Text>
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
                  description={`${clasesDelDia.length} clases`}
                  expanded={estaAbierto}
                  onPress={() => setExpandedId(estaAbierto ? null : fechaID)}
                  titleStyle={{ color: estaAbierto ? COLORS.accent : COLORS.textMain, textTransform: 'capitalize' }}
                  style={styles.accordion}
                  left={props => <List.Icon {...props} icon="calendar-month" color={estaAbierto ? COLORS.accent : COLORS.textSub} />}
                >
                  {clasesDelDia.length > 0 ? (
                    clasesDelDia.map((clase) => {
                      const estado = obtenerInfoEstado(clase);
                      return (
                        <List.Item
                          key={clase.id}
                          title={clase.nombre}
                          description={`${clase.horaInicio} - ${clase.horaFin}\nCoach: ${clase.coach}\nVacantes: ${clase.vacantes}`}
                          titleStyle={{ color: COLORS.textMain, fontWeight: 'bold' }}
                          descriptionStyle={{ color: COLORS.textSub }}
                          style={[styles.listItem, { borderLeftWidth: 4, borderLeftColor: estado.color }]}
                          left={props => <List.Icon {...props} icon={estado.icon} color={estado.color} />}
                          right={() => (
                            <View style={{ justifyContent: 'center', alignItems: 'flex-end', paddingRight: 5 }}>
                              <Text style={{ color: estado.color, fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>{estado.label}</Text>
                              {estado.label === 'LIBRE' && (
                                <Button compact mode="contained" buttonColor={COLORS.accent} textColor="#000" labelStyle={{fontSize: 10}} onPress={() => manejarInscripcion(clase.id)}>
                                  Inscribir
                                </Button>
                              )}
                            </View>
                          )}
                        />
                      );
                    })
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No hay clases para este día.</Text>
                    </View>
                  )}
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
  header: { padding: 20, backgroundColor: COLORS.cardBg, alignItems: 'center', borderBottomRightRadius: 20, borderBottomLeftRadius: 20, elevation: 5 },
  headerTitle: { color: COLORS.textMain, fontWeight: 'bold', fontSize: 18 },
  headerSubtitle: { color: COLORS.accent, marginTop: 10, fontWeight: 'bold' },
  filterBtn: { marginTop: 10, borderColor: COLORS.accent, width: '80%' },
  scrollContent: { padding: 15 },
  accordion: { backgroundColor: COLORS.cardBg, marginBottom: 8, borderRadius: 10 },
  listItem: { backgroundColor: '#1e1e1e', marginHorizontal: 10, borderRadius: 8, marginBottom: 5 },
  emptyContainer: { padding: 15, alignItems: 'center' },
  emptyText: { color: COLORS.textSub, fontSize: 12 },
  modalContainer: { backgroundColor: COLORS.cardBg, padding: 20, margin: 20, borderRadius: 15, borderStartWidth: 1, borderColor: COLORS.accent },
  modalTitle: { color: COLORS.accent, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  chip: { marginBottom: 8 },
  chipActive: { backgroundColor: COLORS.accent },
  chipInactive: { backgroundColor: '#333' },
});