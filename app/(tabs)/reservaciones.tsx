import React, { useState, useContext, useCallback } from 'react';
import { View, StyleSheet, ScrollView, StatusBar, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { 
  Text, List, Surface, DefaultTheme, 
  Provider as PaperProvider, Portal, Modal, Button 
} from 'react-native-paper';
import { format, addDays, startOfWeek } from 'date-fns'; 
import { es } from 'date-fns/locale'; 
import { useFocusEffect } from '@react-navigation/native';

import { UserContext } from '../../components/UserContext'; 
import { obtenerClasesGimnasio, obtenerMisClases, inscribirAClase } from '@/services/api';

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
}

const COLORS = {
  bg: '#000000',           
  cardBg: '#121212',       
  accent: '#39FF14',    
  textMain: '#FFFFFF',     
  textSub: '#A0A0A0',      
  inscrito: '#FF8C00',  // NARANJA: Clase donde SÍ estás anotado
  lleno: '#FF0000',     
  espera: '#FFD700',    
  ocupado: '#FF4500', 
  bloqueado: '#a39191', // GRIS OSCURO: Para clases con choque de horario
};

const MAPA_DISCIPLINAS: { [key: number]: string } = {
  1: 'Spinning',
  2: 'Yoga',
  3: 'Cardio',
  4: 'Barre',
  5: 'Zumba',
  6: 'Zumba',
  7: 'Zumba 2',
  8: 'Gimnasio',
  9: 'Gimnasio',
  1009: 'CrossFit',
  1010: 'Cardio',
  1011: 'Cardio',
  1012: 'Spinning',
  1013: 'Pilates',
  1014: 'Zumba',
  2013: 'Ola',
  2014: 'Sdf',
  3017: 'Spinning',
  3018: 'Box',
  3019: 'Spinning',
  3020: 'Box',
  4019: 'Capoeira'
};
export default function ReservacionesScreen() {
  const { users } = useContext(UserContext);
  console.log("USUARIObg", users);
  const gimnasioId = users?.gymId; 
  const usuarioIdActual = Number(users?.id); 

  const [inicioSemana] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const diasSemana = Array.from({ length: 7 }, (_, i) => addDays(inicioSemana, i));
  
  const [clasesDisponibles, setClasesDisponibles] = useState<Clase[]>([]);
  const [misClasesInscritas, setMisClasesInscritas] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(format(new Date(), 'yyyy-MM-dd'));
  const [modalEquipoVisible, setModalEquipoVisible] = useState(false);
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

  //Fucion clave para el manejo de los estados de actividad de classes Disponible, lleno y inscrito
  const obtenerInfoEstado = (clase: Clase) => {
  const claseIdNum = Number(clase.id);
  const totalOcupados = (clase.lugaresOcupados || []).length;
  const estaLleno = totalOcupados >= clase.vacantes;

  // 1. ¿ESTOY YO INSCRITO EN ESTA CLASE ESPECÍFICA? (Prioridad Naranja/Amarillo)
  const inscripcionPropia = misClasesInscritas.find(
    (ins) => Number(ins.clase_ID) === claseIdNum
  );

  if (inscripcionPropia) {
    if (inscripcionPropia.lugar === 0) {
      return { color: COLORS.espera, label: 'EN ESPERA', tipo: 'ESPERA' };
    }
    return { color: COLORS.inscrito, label: 'INSCRITO', tipo: 'INSCRITO' };
  }

  // 2. SI NO ESTOY EN ESTA, ¿TENGO OTRA CLASE YA RESERVADA A ESTA HORA? (Prioridad Gris)
  // Buscamos en todas las clases disponibles si hay alguna donde mi ID aparezca
  // que coincida en día y hora con la que estamos dibujando ahora.
  const tengoOtraClaseEsaHora = clasesDisponibles.some(c => {
    const soyYo = (c.lugaresOcupados || []).some(id => Number(id) === usuarioIdActual);
    const estoyEnEspera = misClasesInscritas.some(ins => Number(ins.clase_ID) === Number(c.id));
    
    return (soyYo || estoyEnEspera) && 
           c.dia === clase.dia && 
           c.horaInicio === clase.horaInicio && 
           Number(c.id) !== claseIdNum; // Importante: que sea OTRA clase
  });

  if (tengoOtraClaseEsaHora) {
    return { color: COLORS.bloqueado, label: 'HORARIO OCUPADO', tipo: 'BLOQUEADO' };
  }

  // 3. SI NO ESTOY YO Y NO TENGO CHOQUES, ¿ESTÁ LLENA? (Rojo)
  if (estaLleno) {
    return { color: COLORS.lleno, label: 'LLENO', tipo: 'LLENO' };
  }

  // 4. LIBRE (Verde)
  return { color: COLORS.accent, label: 'LIBRE', tipo: 'LIBRE' };
};

  const manejarClickBoton = (clase: Clase) => {
    const estado = obtenerInfoEstado(clase);

    // 1. BLOQUEO PARA HORARIO OCUPADO (Botón Gris)
    if (estado.tipo === 'BLOQUEADO') {
      Alert.alert(
        "Horario Ocupado", 
        "Ya tienes una clase registrada en este mismo horario. No puedes inscribirte a dos clases simultáneas."
      );
      return;
    }

    // 2. BLOQUEO SI YA ESTÁS INSCRITO (Botón Naranja)
    if (estado.tipo === 'INSCRITO') {
      Alert.alert("Aviso", "Ya tienes una reservación registrada en esta clase.");
      return;
    }

    // 3. MANEJO DE LISTA DE ESPERA (Botón Amarillo / Rojo)
    if (estado.tipo === 'ESPERA') {
      Alert.alert("Aviso", "Ya estás en la lista de espera.");
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

    // 4. FLUJO NORMAL PARA CLASE LIBRE (Botón Verde)
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
      // Actualizamos el estado local inmediatamente
      setMisClasesInscritas(prev => [...prev, { clase_ID: idClase, lugar: lugar }]);
    } catch (error: any) {
      if (error.message.includes("ya estás en la lista")) {
        setMisClasesInscritas(prev => [...prev, { clase_ID: idClase, lugar: 0 }]);
      } else {
        Alert.alert("Error", error.message);
      }
    } finally {
      await cargarDatos();
      setLoading(false);
    }
  };

  const clasesFiltradas = disciplinaSeleccionada === 'Todas las Clases' 
    ? clasesDisponibles : clasesDisponibles.filter(c => c.nombre === disciplinaSeleccionada);

  return (
    <PaperProvider theme={{...DefaultTheme, colors: {...DefaultTheme.colors, background: COLORS.bg}}}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Portal>
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
          <Text style={styles.headerTitle}>HORARIOS SEMANALES</Text>
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
                            <Text style={{ color: estado.color, fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>{estado.label}</Text>
                            <Button 
                              mode="contained" 
                              buttonColor={estado.color} 
                              onPress={() => manejarClickBoton(clase)} 
                              labelStyle={{ fontSize: 11, color: '#000', fontWeight: 'bold' }}
                              style={{ borderRadius: 20 }}
                            >
                              {estado.tipo === 'ESPERA' ? 'En Espera' : (estado.tipo === 'LLENO' ? 'Esperar' : 'Inscribir')}
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
  header: { padding: 20, backgroundColor: COLORS.cardBg, alignItems: 'center' },
  headerTitle: { color: COLORS.textMain, fontWeight: 'bold', fontSize: 18 },
  dateRange: { color: COLORS.accent, fontSize: 12, marginTop: 8 },
  scrollContent: { padding: 15 },
  accordion: { backgroundColor: COLORS.cardBg, marginBottom: 5 },
  listItem: { backgroundColor: '#1e1e1e', marginBottom: 5, borderRadius: 5, paddingVertical: 8 },
  rightContainer: { justifyContent: 'center', alignItems: 'center', minWidth: 100 },
  modalContainer: { backgroundColor: COLORS.cardBg, padding: 20, margin: 20, borderRadius: 10 },
  modalTitle: { color: COLORS.accent, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  filaLugares: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 20 },
  botonLugar: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 5 }
});