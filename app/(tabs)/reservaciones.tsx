import React, { useState, useContext, useCallback } from 'react';
import { View, StyleSheet, ScrollView, StatusBar, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { 
  Text, List, Surface, DefaultTheme, 
  Provider as PaperProvider, Portal, Modal, Button, IconButton 
} from 'react-native-paper';
import { format, isBefore, parse } from 'date-fns'; 
import { es } from 'date-fns/locale'; 
import { useFocusEffect } from '@react-navigation/native';

import { UserContext } from '../../components/UserContext'; 
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
  pasadoText: '#B0B0B0', 
  pasadoBorder: '#444444', 
};

export default function ReservacionesScreen() {
  const { users } = useContext(UserContext);
  const gimnasioId = Number(users?.gymId); 
  const usuarioIdActual = Number(users?.id); 

  const { 
    sincronizarClasesGimnasio, 
    inscribirAClaseProceso, 
    cancelarInscripcionProceso, 
    obtenerMisClasesProceso 
  } = useAuthService();

  const [inicioSemana] = useState(() => {
    const ahora = new Date();
    const tiempoSonora = new Date(ahora.getTime() - (7 * 60 * 60 * 1000));
    const numeroDia = tiempoSonora.getUTCDay(); 
    let lunesBase = new Date(tiempoSonora);
    if (numeroDia === 0) lunesBase.setUTCDate(lunesBase.getUTCDate() - 6);
    else lunesBase.setUTCDate(lunesBase.getUTCDate() - (numeroDia - 1));
    lunesBase.setUTCHours(0, 0, 0, 0);
    return lunesBase;
  });

  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicioSemana);
    d.setUTCDate(d.getUTCDate() + i);
    return d;
  });
  
  const [clasesDisponibles, setClasesDisponibles] = useState<Clase[]>([]);
  const [misClasesInscritas, setMisClasesInscritas] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  
  const hoyStr = new Date(new Date().getTime() - (7 * 60 * 60 * 1000)).toISOString().split('T')[0];
  const [expandedId, setExpandedId] = useState<string | null>(hoyStr);

  const [modalEquipoVisible, setModalEquipoVisible] = useState(false);
  const [modalGestionVisible, setModalGestionVisible] = useState(false); 
  const [claseSeleccionada, setClaseSeleccionada] = useState<Clase | null>(null); 

  const cargarDatos = async () => {
    if (!gimnasioId || !usuarioIdActual) return;
    setLoading(true);
    try {
      const datosLocales = await sincronizarClasesGimnasio(gimnasioId, usuarioIdActual);
      const formateadas: Clase[] = datosLocales.map((item: any) => ({
        id: item.claseId, 
        nombre: item.nombreClase,
        horaInicio: item.horaInicio,
        horaFin: item.horaFin,
        coach: item.coach,
        dia: item.fecha,
        tipoClaseID: item.tipoClaseID,
        vacantes: item.vacantes,
        lugaresOcupados: JSON.parse(item.lugaresOcupados || '[]'),
        esperaUsers: JSON.parse(item.esperaUsers || '[]'),
      }));

      setClasesDisponibles(formateadas);
      const inscripciones = await obtenerMisClasesProceso(usuarioIdActual, gimnasioId);
      
      // FILTRO CRÍTICO: Solo mostrar en "Mis Reservaciones" las que NO han pasado
      const activas = inscripciones.filter((ins: any) => {
        const f = ins.fecha || ins.dia;
        const h = ins.horaInicio;
        if (!f || !h) return true;
        return !verificarSiYaPaso(f, h);
      });

      setMisClasesInscritas(activas);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useFocusEffect(useCallback(() => { cargarDatos(); }, [gimnasioId]));

  const verificarSiYaPaso = (fecha: string, hora: string) => {
    const ahora = new Date();
    const tiempoSonora = new Date(ahora.getTime() - (7 * 60 * 60 * 1000));
    // Limpiamos la fecha para evitar desfases de zona horaria al parsear
    const fechaLimpia = fecha.split('T')[0]; 
    const fechaClase = parse(`${fechaLimpia} ${hora}`, 'yyyy-MM-dd HH:mm:ss', new Date());
    return isBefore(fechaClase, tiempoSonora);
  };

  const obtenerInfoEstado = (clase: Clase) => {
    const yaPaso = verificarSiYaPaso(clase.dia, clase.horaInicio);
    if (yaPaso) return { color: COLORS.pasadoText, label: 'PASADO', tipo: 'EXPIRADO' };

    const claseIdNum = Number(clase.id);
    const inscripcionPropia = misClasesInscritas.find(
      (ins) => Number(ins.id || ins.claseId || ins.clase_ID) === claseIdNum
    );

    if (inscripcionPropia) {
      const esEspera = (inscripcionPropia.lugar === 0 || inscripcionPropia.lugar === "0");
      return { 
        color: esEspera ? COLORS.espera : COLORS.inscrito, 
        label: esEspera ? 'EN ESPERA' : 'INSCRITO', 
        tipo: esEspera ? 'ESPERA' : 'INSCRITO' 
      };
    }

    const estaLleno = (clase.lugaresOcupados || []).length >= clase.vacantes;
    if (estaLleno) return { color: COLORS.lleno, label: 'LLENO', tipo: 'LLENO' };
    
    return { color: COLORS.accent, label: 'LIBRE', tipo: 'LIBRE' };
  };

  const ejecutarCancelacion = async (idClase: string | number) => {
    // Buscamos si la clase ya pasó antes de intentar cancelar
    const claseOriginal = clasesDisponibles.find(c => Number(c.id) === Number(idClase));
    if (claseOriginal && verificarSiYaPaso(claseOriginal.dia, claseOriginal.horaInicio)) {
      Alert.alert("Aviso", "No se puede cancelar una clase que ya pasó.");
      return;
    }

    setLoading(true);
    try {
      await cancelarInscripcionProceso(idClase);
      Alert.alert("Éxito", "Reserva cancelada.");
      await cargarDatos(); // Recargamos para limpiar la UI
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
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
      await cargarDatos();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PaperProvider theme={{...DefaultTheme, colors: {...DefaultTheme.colors, background: COLORS.bg}}}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Portal>
          {/* MODAL GESTIÓN: Ahora filtrado por fecha */}
          <Modal visible={modalGestionVisible} onDismiss={() => setModalGestionVisible(false)} contentContainerStyle={styles.modalGestion}>
            <Text style={styles.modalTitle}>MIS RESERVACIONES ACTIVAS</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {misClasesInscritas.length === 0 ? (
                <Text style={{ color: COLORS.textSub, textAlign: 'center', marginVertical: 20 }}>No tienes clases próximas.</Text>
              ) : (
                misClasesInscritas.map((ins, index) => (
                  <View key={index} style={styles.itemGestion}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: COLORS.textMain, fontWeight: 'bold' }}>{ins.nombreClase}</Text>
                      <Text style={{ color: (ins.lugar === 0 || ins.lugar === "0") ? COLORS.espera : COLORS.inscrito, fontSize: 12 }}>
                        {(ins.lugar === 0 || ins.lugar === "0") ? 'LISTA DE ESPERA' : `LUGAR: ${ins.lugar}`}
                      </Text>
                    </View>
                    <Button 
                      textColor={COLORS.lleno} 
                      onPress={() => { setModalGestionVisible(false); ejecutarCancelacion(ins.claseId || ins.id || ins.clase_ID); }}
                    >
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
                            style={[styles.botonLugar, { backgroundColor: estaOcupado ? '#333' : COLORS.accent }]}
                        >
                            <Text style={{ fontWeight: 'bold', color: estaOcupado ? '#666' : '#000' }}>{num}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
            <Button onPress={() => setModalEquipoVisible(false)} textColor={COLORS.accent}>Cerrar</Button>
          </Modal>
        </Portal>

        <Surface style={styles.header}>
          <View style={styles.headerRow}>
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
              const fechaID = dia.toISOString().split('T')[0];
              const clasesDelDia = clasesDisponibles.filter(c => c.dia.split('T')[0] === fechaID);
              return (
                <List.Accordion
                  key={fechaID}
                  title={format(dia, "EEEE d 'De' MMMM", { locale: es })}
                  expanded={expandedId === fechaID}
                  onPress={() => setExpandedId(expandedId === fechaID ? null : fechaID)}
                  style={styles.accordion}
                  titleStyle={styles.accordionTitle}
                >
                  {clasesDelDia.map((clase) => {
                    const estado = obtenerInfoEstado(clase);
                    const esPasada = estado.tipo === 'EXPIRADO';

                    return (
                      <List.Item
                        key={clase.id}
                        title={clase.nombre}
                        description={`${clase.horaInicio} - ${clase.horaFin}\nVacantes: ${clase.vacantes}`}
                        titleStyle={{ color: esPasada ? COLORS.pasadoText : COLORS.textMain, fontWeight: 'bold' }}
                        descriptionStyle={{ color: COLORS.textSub }}
                        style={[styles.listItem, { borderLeftColor: esPasada ? COLORS.pasadoBorder : estado.color }]}
                        right={() => (
                          <View style={styles.rightContainer}>
                            {esPasada ? (
                              <View style={styles.boxPasado}><Text style={styles.textPasado}>PASADO</Text></View>
                            ) : (
                              <>
                                <Text style={{ color: estado.color, fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>{estado.label}</Text>
                                <Button 
                                  mode="contained" 
                                  buttonColor={estado.color} 
                                  onPress={() => {
                                    setClaseSeleccionada(clase);
                                    if (estado.tipo === 'INSCRITO' || estado.tipo === 'ESPERA') {
                                      ejecutarCancelacion(clase.id);
                                    } else if (estado.tipo === 'LIBRE') {
                                      setModalEquipoVisible(true);
                                    }
                                  }} 
                                  labelStyle={{ fontSize: 11, color: '#000', fontWeight: 'bold' }}
                                  style={styles.btnAccion}
                                >
                                  {(estado.tipo === 'ESPERA' || estado.tipo === 'INSCRITO') ? 'Cancelar' : 'Inscribir'}
                                </Button>
                              </>
                            )}
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
  header: { paddingVertical: 10, backgroundColor: COLORS.cardBg, alignItems: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 15 },
  headerTitle: { color: COLORS.textMain, fontWeight: 'bold', fontSize: 18 },
  scrollContent: { padding: 15 },
  accordion: { backgroundColor: COLORS.cardBg, marginBottom: 5 },
  accordionTitle: { color: COLORS.textMain, textTransform: 'capitalize' },
  listItem: { backgroundColor: '#1e1e1e', marginBottom: 5, borderRadius: 5, paddingVertical: 10, borderLeftWidth: 4 },
  rightContainer: { justifyContent: 'center', alignItems: 'center', minWidth: 110 },
  btnAccion: { borderRadius: 20, minWidth: 95 },
  boxPasado: { borderWidth: 1, borderColor: COLORS.pasadoBorder, borderRadius: 8, paddingHorizontal: 15, paddingVertical: 8, minWidth: 95, alignItems: 'center' },
  textPasado: { color: COLORS.pasadoText, fontSize: 11, fontWeight: 'bold' },
  modalContainer: { backgroundColor: COLORS.cardBg, padding: 20, margin: 20, borderRadius: 10 },
  modalGestion: { backgroundColor: COLORS.cardBg, padding: 20, margin: 20, borderRadius: 15 },
  modalTitle: { color: COLORS.accent, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  filaLugares: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 20 },
  botonLugar: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 5 },
  itemGestion: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#333' }
});