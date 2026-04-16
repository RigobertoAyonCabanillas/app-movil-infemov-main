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
    obtenerMisClasesProceso,
    obtenerMembresiasLocal,
    obtenerCreditosLocal
  } = useAuthService();

  // --- LÓGICA DE FECHAS CORREGIDA (LUNES A DOMINGO) ---
  const [inicioSemana] = useState(() => {
    const ahora = new Date();
    // Ajuste para trabajar con la fecha local de Sonora sin desfases de UTC
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    
    // getDay() devuelve: 0 para Domingo, 1 para Lunes, etc.
    const numeroDia = hoy.getDay(); 
    const diferenciaAlLunes = numeroDia === 0 ? -6 : 1 - numeroDia;
    
    const lunesBase = new Date(hoy);
    lunesBase.setDate(hoy.getDate() + diferenciaAlLunes);
    lunesBase.setHours(0, 0, 0, 0);
    return lunesBase;
  });

  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicioSemana);
    d.setDate(inicioSemana.getDate() + i);
    return d;
  });
  
  const [clasesDisponibles, setClasesDisponibles] = useState<Clase[]>([]);
  const [misClasesInscritas, setMisClasesInscritas] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [tieneAcceso, setTieneAcceso] = useState(false);
  
  // Hoy en formato YYYY-MM-DD para abrir el acordeón por defecto
  const hoyISO = new Date().toISOString().split('T')[0];
  const [expandedId, setExpandedId] = useState<string | null>(hoyISO);

  const [modalEquipoVisible, setModalEquipoVisible] = useState(false);
  const [modalGestionVisible, setModalGestionVisible] = useState(false); 
  const [claseSeleccionada, setClaseSeleccionada] = useState<Clase | null>(null); 

  const cargarDatos = async () => {
    if (!gimnasioId || !usuarioIdActual) return;
    setLoading(true);
    try {
      const membresias = await obtenerMembresiasLocal(usuarioIdActual);
      const creditos = await obtenerCreditosLocal(usuarioIdActual);
      setTieneAcceso(membresias.length > 0 || creditos.length > 0);

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
      setMisClasesInscritas(inscripciones);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useFocusEffect(useCallback(() => { cargarDatos(); }, [gimnasioId]));

  const verificarSiYaPaso = (fecha: string, hora: string) => {
    const ahora = new Date();
    const fechaLimpia = fecha.split('T')[0]; 
    const fechaClase = parse(`${fechaLimpia} ${hora}`, 'yyyy-MM-dd HH:mm:ss', new Date());
    return isBefore(fechaClase, ahora);
  };

  const obtenerInfoEstado = (clase: Clase) => {
    const yaPaso = verificarSiYaPaso(clase.dia, clase.horaInicio);
    if (yaPaso) return { color: COLORS.pasadoText, label: 'PASADO', tipo: 'EXPIRADO' };

    const claseIdNum = Number(clase.id);
    const inscripcionPropia = misClasesInscritas.find(
      (ins) => Number(ins.claseId || ins.id || ins.clase_ID) === claseIdNum
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
    if (estaLleno) return { color: COLORS.espera, label: 'LISTA DE ESPERA', tipo: 'DISPONIBLE_ESPERA' };
    
    return { color: COLORS.accent, label: 'LIBRE', tipo: 'LIBRE' };
  };

  const ejecutarCancelacion = async (idClase: string | number) => {
    setLoading(true);
    try {
      await cancelarInscripcionProceso(idClase);
      Alert.alert("Éxito", "Reserva cancelada.");
      await cargarDatos(); 
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
      Alert.alert("Éxito", "Operación realizada correctamente.");
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
          {/* Modal Lugares */}
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

          {/* Modal Mis Reservaciones */}
          <Modal visible={modalGestionVisible} onDismiss={() => setModalGestionVisible(false)} contentContainerStyle={styles.modalGestion}>
            <Text style={styles.modalTitle}>MIS PRÓXIMAS CLASES</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {misClasesInscritas.length === 0 ? (
                <Text style={{ color: COLORS.textSub, textAlign: 'center', marginVertical: 20 }}>No tienes reservaciones activas.</Text>
              ) : (
                misClasesInscritas.map((ins, index) => (
                  <View key={index} style={styles.itemGestion}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: COLORS.textMain, fontWeight: 'bold' }}>{ins.nombreClase}</Text>
                      <Text style={{ color: COLORS.textSub, fontSize: 12 }}>{ins.dia} | {ins.horaInicio}</Text>
                    </View>
                    <Button textColor={COLORS.lleno} onPress={() => { setModalGestionVisible(false); ejecutarCancelacion(ins.claseId || ins.id); }}>
                      Cancelar
                    </Button>
                  </View>
                ))
              )}
            </ScrollView>
            <Button onPress={() => setModalGestionVisible(false)} textColor={COLORS.accent}>Cerrar</Button>
          </Modal>
        </Portal>

        <Surface style={styles.header}>
          <View style={styles.headerRow}>
            <IconButton icon="menu" iconColor={COLORS.textMain} size={25} />
            <Text style={styles.headerTitle}>RESERVACIONES</Text>
            <IconButton icon="calendar-check" iconColor={COLORS.accent} size={28} onPress={() => setModalGestionVisible(true)} />
          </View>
        </Surface>

        {!tieneAcceso && !loading && (
          <Surface style={styles.noAccessBanner}>
             <Text style={styles.noAccessText}>⚠️ No tienes membresía activa o créditos.</Text>
          </Surface>
        )}

        {loading ? (
          <ActivityIndicator style={{marginTop: 50}} color={COLORS.accent} size="large" />
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {diasSemana.map((dia) => {
              const fechaID = dia.toISOString().split('T')[0];
              const clasesDelDia = clasesDisponibles.filter(c => c.dia.split('T')[0] === fechaID);
              const esHoy = fechaID === hoyISO;

              return (
                <List.Accordion
                  key={fechaID}
                  title={format(dia, "EEEE d 'de' MMMM", { locale: es })}
                  expanded={expandedId === fechaID}
                  onPress={() => setExpandedId(expandedId === fechaID ? null : fechaID)}
                  style={styles.accordion}
                  titleStyle={[styles.accordionTitle, esHoy && { color: COLORS.accent, fontWeight: 'bold' }]}
                >
                  {clasesDelDia.map((clase) => {
                    const estado = obtenerInfoEstado(clase);
                    const esPasada = estado.tipo === 'EXPIRADO';

                    return (
                      <List.Item
                        key={clase.id}
                        title={clase.nombre}
                        description={`${clase.horaInicio} - ${clase.horaFin}\nCoach: ${clase.coach}`}
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
                                      if (estado.tipo === 'INSCRITO' || estado.tipo === 'ESPERA') {
                                        ejecutarCancelacion(clase.id);
                                      } else {
                                        if (!tieneAcceso) {
                                            Alert.alert("Aviso", "Necesitas una membresía o créditos.");
                                            return;
                                        }
                                        setClaseSeleccionada(clase);
                                        estado.tipo === 'LIBRE' ? setModalEquipoVisible(true) : manejarInscripcionFinal(0);
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
  header: { paddingVertical: 10, backgroundColor: COLORS.cardBg, elevation: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 },
  headerTitle: { color: COLORS.textMain, fontWeight: 'bold', fontSize: 18, letterSpacing: 1 },
  scrollContent: { padding: 15 },
  accordion: { backgroundColor: COLORS.cardBg, marginBottom: 5, borderRadius: 8 },
  accordionTitle: { color: COLORS.textMain, textTransform: 'capitalize' },
  listItem: { backgroundColor: '#1e1e1e', marginBottom: 5, borderRadius: 5, borderLeftWidth: 4 },
  rightContainer: { justifyContent: 'center', alignItems: 'center', minWidth: 100 },
  btnAccion: { borderRadius: 20, height: 35, justifyContent: 'center' },
  boxPasado: { borderWidth: 1, borderColor: COLORS.pasadoBorder, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  textPasado: { color: COLORS.pasadoText, fontSize: 11, fontWeight: 'bold' },
  modalContainer: { backgroundColor: COLORS.cardBg, padding: 20, margin: 20, borderRadius: 10 },
  modalGestion: { backgroundColor: COLORS.cardBg, padding: 20, margin: 20, borderRadius: 15 },
  modalTitle: { color: COLORS.accent, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, fontSize: 16 },
  filaLugares: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 20 },
  botonLugar: { width: 45, height: 45, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  itemGestion: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#333' },
  noAccessBanner: { margin: 15, padding: 12, backgroundColor: '#2a0000', borderRadius: 8, borderLeftWidth: 5, borderLeftColor: COLORS.lleno },
  noAccessText: { color: '#FFAAAA', fontWeight: 'bold', textAlign: 'center' }
});