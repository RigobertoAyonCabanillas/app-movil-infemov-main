import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { format, isBefore, parse, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import React, { useCallback, useContext, useState, useRef, useEffect } from 'react';
import { ActivityIndicator, Alert, Dimensions, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  Button,
  DefaultTheme,
  IconButton,
  List,
  Modal,
  Provider as PaperProvider, Portal,
  Surface,
  Text
} from 'react-native-paper';

import { useAuthService } from '@/servicesdb/authService';
import { UserContext } from '../../components/UserContext';

const { width } = Dimensions.get('window');

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
  bloqueado: '#555555',
  warning: '#FFD700', // Color para avisos
};

export default function ReservacionesScreen() {
  const navigation = useNavigation<any>();
  const { users } = useContext(UserContext);
  const gimnasioId = Number(users?.gymId); 
  const usuarioIdActual = Number(users?.id); 

  const scrollLugaresRef = useRef<ScrollView>(null);

  const { 
    sincronizarClasesGimnasio, 
    inscribirAClaseProceso, 
    cancelarInscripcionProceso, 
    obtenerMisClasesProceso,
    obtenerMembresiasLocal,
    obtenerCreditosLocal
  } = useAuthService();

  const [clasesDisponibles, setClasesDisponibles] = useState<Clase[]>([]);
  const [misClasesInscritas, setMisClasesInscritas] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [tieneAcceso, setTieneAcceso] = useState(false);
  
  const hoyISO = new Date().toISOString().split('T')[0];
  const [expandedId, setExpandedId] = useState<string | null>(hoyISO);

  const [modalEquipoVisible, setModalEquipoVisible] = useState(false);
  const [modalGestionVisible, setModalGestionVisible] = useState(false); 
  const [claseSeleccionada, setClaseSeleccionada] = useState<Clase | null>(null); 

  useEffect(() => {
    if (modalEquipoVisible) {
      setTimeout(() => {
        scrollLugaresRef.current?.scrollTo({ y: 0, animated: true });
      }, 150); 
    }
  }, [modalEquipoVisible]);

  const [inicioSemana] = useState(() => {
    const ahora = new Date();
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
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

  const cargarDatos = async () => {
    if (!gimnasioId || !usuarioIdActual) return;
    setLoading(true);
    try {
      const membresias = await obtenerMembresiasLocal(usuarioIdActual);
      const creditos = await obtenerCreditosLocal(usuarioIdActual);
      // Verificamos si tiene membresías activas (estatus 1) o créditos disponibles
      const acceso = (membresias && membresias.some((m: any) => m.estatus === 1)) || (creditos && creditos.length > 0);
      setTieneAcceso(acceso);

      const datosLocales = await sincronizarClasesGimnasio(gimnasioId, usuarioIdActual);
      const formateadas: Clase[] = (datosLocales || []).map((item: any) => ({
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
      setMisClasesInscritas(inscripciones || []);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useFocusEffect(useCallback(() => { cargarDatos(); }, [gimnasioId]));

  const confirmarCancelacion = (idClase: string | number) => {
    Alert.alert(
      "Confirmar Cancelación",
      "¿Estás seguro de que deseas cancelar tu lugar?",
      [
        { text: "No, volver", style: "cancel" },
        { text: "Sí, cancelar", style: "destructive", onPress: () => ejecutarCancelacion(idClase) }
      ]
    );
  };

  const ejecutarCancelacion = async (idClase: string | number) => {
    setLoading(true);
    try {
      await cancelarInscripcionProceso(idClase);
      Alert.alert("Reserva Cancelada", "Tus Créditos fueron regresados exitosamente.");
      await cargarDatos(); 
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const manejarInscripcionFinal = async (lugar: any) => {
    if (!claseSeleccionada) return;

    const realizarPeticion = async () => {
      setModalEquipoVisible(false);
      setLoading(true);
      try {
        await inscribirAClaseProceso(claseSeleccionada.id, lugar, usuarioIdActual);
        const tituloExito = lugar === 0 ? "Lista de Espera" : "Inscripción Exitosa";
        const mensajeExito = lugar === 0 
          ? "Te hemos agregado a la lista de espera correctamente." 
          : `Tu lugar #${lugar} ha sido reservado para ${claseSeleccionada.nombre}.`;
        
        Alert.alert(tituloExito, mensajeExito);
        await cargarDatos();
      } catch (error: any) {
        Alert.alert("Error al inscribir", error.message);
      } finally {
        setLoading(false);
      }
    };

    if (lugar === 0) {
      Alert.alert("Unirse a Espera", "¿Quieres entrar en lista de espera?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Confirmar", onPress: realizarPeticion }
      ]);
    } else {
      Alert.alert("Confirmar Lugar", `¿Confirmas la reserva del lugar ${lugar}?`, [
        { text: "Cambiar", style: "cancel" },
        { text: "Confirmar", onPress: realizarPeticion }
      ]);
    }
  };

  const obtenerInfoEstado = (clase: Clase) => {
    const yaPaso = (fecha: string, hora: string) => {
        try {
            if (!fecha || !hora) return false;
            const ahora = new Date();
            const fechaLimpia = fecha.split('T')[0]; 
            const fechaClase = parse(`${fechaLimpia} ${hora}`, 'yyyy-MM-dd HH:mm:ss', new Date());
            return isBefore(fechaClase, ahora);
        } catch (e) { return false; }
    };

    if (yaPaso(clase.dia, clase.horaInicio)) return { color: COLORS.pasadoText, label: 'PASADO', tipo: 'EXPIRADO' };

    const inscripcionPropia = misClasesInscritas.find(
      (ins) => Number(ins.claseId || ins.id) === Number(clase.id)
    );

    if (inscripcionPropia) {
      const esEspera = (inscripcionPropia.lugar === 0 || inscripcionPropia.lugar === "0");
      return { 
        color: esEspera ? COLORS.espera : COLORS.inscrito, 
        label: esEspera ? 'EN ESPERA' : 'INSCRITO', 
        tipo: esEspera ? 'ESPERA' : 'INSCRITO' 
      };
    }

    const fechaClaseCorte = (clase.dia || "").substring(0, 10);
    const tieneConflicto = misClasesInscritas.some(ins => 
        (ins.dia || ins.fecha || "").substring(0, 10) === fechaClaseCorte && 
        ins.horaInicio === clase.horaInicio
    );

    if (tieneConflicto) return { color: COLORS.bloqueado, label: 'HORARIO OCUPADO', tipo: 'BLOQUEADO' };

    const estaLleno = (clase.lugaresOcupados || []).length >= clase.vacantes;
    if (estaLleno) return { color: COLORS.espera, label: 'LISTA DE ESPERA', tipo: 'DISPONIBLE_ESPERA' };
    
    return { color: COLORS.accent, label: 'LIBRE', tipo: 'LIBRE' };
  };

  return (
    <PaperProvider theme={{...DefaultTheme, colors: {...DefaultTheme.colors, background: COLORS.bg}}}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        <Portal>
          <Modal visible={modalEquipoVisible} onDismiss={() => setModalEquipoVisible(false)} contentContainerStyle={styles.modalContainer}>
            <Text style={styles.modalTitle}>SELECCIONA TU LUGAR</Text>
            <ScrollView 
                ref={scrollLugaresRef}
                contentContainerStyle={styles.scrollLugaresContent} 
                showsVerticalScrollIndicator={true}
                // IMPORTANTE: Esto controla que no se quede pegado en los extremos si el contenido es pequeño
                bounces={true} 
                alwaysBounceVertical={true}
              >
              {(() => {
                const vacantes = claseSeleccionada?.vacantes || 0;
                const elementos = Array.from({ length: vacantes }, (_, i) => i + 1);
                const filas = [];
                let index = 0;
                let esFilaDeCuatro = true;
                while (index < elementos.length) {
                  const numEnFila = esFilaDeCuatro ? 4 : 3;
                  const filaActual = elementos.slice(index, index + numEnFila);
                  filas.push(
                    <View key={`fila-${index}`} style={styles.filaPersonalizada}>
                      {filaActual.map((num) => {
                        const estaOcupado = (claseSeleccionada?.lugaresOcupados || []).includes(num);
                        return (
                          <TouchableOpacity 
                            key={num} 
                            disabled={estaOcupado} 
                            onPress={() => manejarInscripcionFinal(num)} 
                            style={[styles.botonLugar, { backgroundColor: estaOcupado ? '#333' : COLORS.accent }]}
                          >
                            <Text style={{ fontWeight: 'bold', color: estaOcupado ? '#666' : '#000' }}>{num}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                  index += numEnFila;
                  esFilaDeCuatro = !esFilaDeCuatro;
                }
                return filas;
              })()}
            </ScrollView>
            <View style={styles.footerModal}>
              <Button onPress={() => setModalEquipoVisible(false)} textColor={COLORS.accent}>Cerrar</Button>
            </View>
          </Modal>

          <Modal visible={modalGestionVisible} onDismiss={() => setModalGestionVisible(false)} contentContainerStyle={styles.modalGestion}>
              <Text style={styles.modalTitle}>MIS PRÓXIMAS CLASES</Text>
              <ScrollView style={{ maxHeight: 400 }}>
                {misClasesInscritas.length === 0 ? (
                  <Text style={{ color: COLORS.textSub, textAlign: 'center', marginVertical: 20 }}>No tienes reservaciones activas.</Text>
                ) : (
                  misClasesInscritas.map((ins, index) => {
                    const esEspera = (ins.lugar === 0 || ins.lugar === "0");
                    const fechaMostrar = (ins.dia || ins.fecha || "").substring(0, 10);
                    return (
                      <View key={index} style={styles.itemGestion}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: COLORS.textMain, fontWeight: 'bold' }}>{ins.nombreClase}</Text>
                          <Text style={{ color: COLORS.textSub, fontSize: 12 }}>{fechaMostrar} | {ins.horaInicio}</Text>
                          <Text style={{ color: esEspera ? COLORS.espera : COLORS.inscrito, fontSize: 11, fontWeight: 'bold', marginTop: 4 }}>
                              {esEspera ? '● EN ESPERA' : `● LUGAR: ${ins.lugar}`}
                          </Text>
                        </View>
                        <Button textColor={COLORS.lleno} onPress={() => { setModalGestionVisible(false); confirmarCancelacion(ins.claseId || ins.id); }}>Cancelar</Button>
                      </View>
                    );
                  })
                )}
              </ScrollView>
              <View style={styles.footerModal}>
                <Button onPress={() => setModalGestionVisible(false)} textColor={COLORS.accent}>Cerrar</Button>
              </View>
          </Modal>
        </Portal>

        <Surface style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>RESERVACIONES</Text>
            <IconButton 
              icon="calendar-check" 
              iconColor={COLORS.accent} 
              size={28} 
              onPress={() => setModalGestionVisible(true)} 
            />
          </View>
        </Surface>

        {loading ? (
          <ActivityIndicator style={{marginTop: 50}} color={COLORS.accent} size="large" />
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            
            {/* 🛡️ AVISO DE TIENDA SI NO TIENE ACCESO */}
            {!tieneAcceso && (
              <Surface style={styles.avisoTienda} elevation={2}>
                <IconButton icon="store-alert" iconColor={COLORS.warning} size={24} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.avisoTitulo}>Sin membresía o creditos activos</Text>
                  <Text style={styles.avisoDesc}>Para reservar una clase necesitas adquirir créditos o un plan en la tienda.</Text>
                </View>
                <Button 
                  mode="text" 
                  textColor={COLORS.accent} 
                  onPress={() => navigation.navigate('tienda')} // Asegúrate que el nombre coincida con tu tab de tienda
                  labelStyle={{ fontWeight: 'bold' }}
                >
                  IR A TIENDA
                </Button>
              </Surface>
            )}

            {diasSemana.map((dia) => {
              const fechaID = dia.toISOString().split('T')[0];
              const clasesDelDia = clasesDisponibles.filter(c => (c.dia || "").substring(0, 10) === fechaID);
              const esHoy = fechaID === hoyISO;
              const diaYaPaso = isBefore(startOfDay(dia), startOfDay(new Date()));
              const sinClases = clasesDelDia.length === 0;
              const estaDeshabilitado = diaYaPaso || sinClases;

              return (
                <List.Accordion
                  key={fechaID}
                  title={format(dia, "EEEE d 'de' MMMM", { locale: es })}
                  expanded={expandedId === fechaID}
                  onPress={() => !estaDeshabilitado && setExpandedId(expandedId === fechaID ? null : fechaID)}
                  style={[styles.accordion, estaDeshabilitado && { opacity: 0.5 }]}
                  rippleColor="transparent"
                  titleStyle={[
                    styles.accordionTitle, 
                    esHoy && { color: COLORS.accent, fontWeight: 'bold' },
                    estaDeshabilitado && { color: COLORS.pasadoText }
                  ]}
                  left={props => (
                    <List.Icon 
                      {...props} 
                      icon={estaDeshabilitado ? "calendar-remove" : "calendar"} 
                      color={estaDeshabilitado ? COLORS.pasadoText : (esHoy ? COLORS.accent : COLORS.textSub)} 
                    />
                  )}
                >
                  {clasesDelDia.map((clase) => {
                    const estado = obtenerInfoEstado(clase);
                    const esPasada = estado.tipo === 'EXPIRADO';
                    const esBloqueado = estado.tipo === 'BLOQUEADO';

                    return (
                      <List.Item
                        key={clase.id}
                        title={clase.nombre}
                        description={`${clase.horaInicio} - ${clase.horaFin}\nCoach: ${clase.coach}`}
                        titleStyle={{ color: (esPasada || esBloqueado) ? COLORS.pasadoText : COLORS.textMain, fontWeight: 'bold' }}
                        descriptionStyle={{ color: COLORS.textSub }}
                        style={[styles.listItem, { borderLeftColor: esPasada ? COLORS.pasadoBorder : estado.color }]}
                        right={() => (
                          <View style={styles.rightContainer}>
                            {!esPasada && (
                              <>
                                <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.estadoLabel, { color: estado.color }]}>
                                  {estado.label}
                                </Text>
                                <Button 
                                  mode="contained" 
                                  buttonColor={esBloqueado ? '#B0B0B0' : estado.color} 
                                  onPress={() => {
                                      if (esBloqueado) return; 
                                      if (estado.tipo === 'INSCRITO' || estado.tipo === 'ESPERA') {
                                        confirmarCancelacion(clase.id);
                                      } else if (tieneAcceso) {
                                        setClaseSeleccionada(clase);
                                        estado.tipo === 'LIBRE' ? setModalEquipoVisible(true) : manejarInscripcionFinal(0);
                                      } else {
                                        // 🛡️ Alerta si intenta inscribirse sin acceso
                                        Alert.alert(
                                          "Acceso Restringido", 
                                          "No cuentas con créditos o membresía activa para reservar.",
                                          [
                                            { text: "Cancelar", style: 'cancel' },
                                            { text: "Ir a Tienda", onPress: () => navigation.navigate('tienda') }
                                          ]
                                        );
                                      }
                                  }}
                                  labelStyle={[styles.btnLabel, { color: '#000000' }]}
                                  style={styles.btnAccion}
                                  contentStyle={styles.btnContent}
                                >
                                  {(estado.tipo === 'ESPERA' || estado.tipo === 'INSCRITO') ? 'Cancelar' : esBloqueado ? 'Ocupado' : 'Inscribir'}
                                </Button>
                              </>
                            )}
                            {esPasada && (
                                <View style={styles.boxPasado}><Text style={styles.textPasado}>PASADO</Text></View>
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
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20 
  },
  headerTitle: { color: COLORS.textMain, fontWeight: 'bold', fontSize: 18, letterSpacing: 3 },
  scrollContent: { padding: 15 },
  // Estilos para el aviso de tienda
  avisoTienda: { 
    backgroundColor: '#1A1A1A', 
    borderRadius: 12, 
    padding: 10, 
    flexDirection: 'row', 
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333'
  },
  avisoTitulo: { color: COLORS.warning, fontWeight: 'bold', fontSize: 14 },
  avisoDesc: { color: COLORS.textSub, fontSize: 11, marginTop: 2 },

  accordion: { backgroundColor: COLORS.cardBg, marginBottom: 5, borderRadius: 8 },
  accordionTitle: { color: COLORS.textMain, textTransform: 'capitalize' },
  listItem: { backgroundColor: '#1e1e1e', marginBottom: 5, borderRadius: 5, borderLeftWidth: 4 },
  rightContainer: { justifyContent: 'center', alignItems: 'center', minWidth: 115, paddingLeft: 5 },
  estadoLabel: { fontSize: 10, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' },
  btnAccion: { borderRadius: 20, width: '100%' },
  btnContent: { height: 34 },
  btnLabel: { fontSize: 11, fontWeight: 'bold', marginVertical: 0, marginHorizontal: 0 },
  boxPasado: { borderWidth: 1, borderColor: COLORS.pasadoBorder, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  textPasado: { color: COLORS.pasadoText, fontSize: 11, fontWeight: 'bold' },
  modalContainer: { backgroundColor: COLORS.cardBg, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10, margin: 20, borderRadius: 20, maxHeight: '85%' },
  modalTitle: { color: COLORS.accent, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, fontSize: 16 },
  scrollLugaresContent: { 
  alignItems: 'center', 
  justifyContent: 'center', // Centra el contenido verticalmente si es poco
  flexGrow: 1,              // Permite que el contenedor crezca para que el scroll funcione
  paddingBottom: 40, 
  paddingTop: 20,           // Añadimos un poco arriba para equilibrio visual
  width: '100%',
  },
  filaPersonalizada: { flexDirection: 'row', justifyContent: 'center', width: '100%', gap: 15, marginBottom: 15 },
  botonLugar: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 12, elevation: 4 },
  modalGestion: { backgroundColor: COLORS.cardBg, padding: 20, margin: 20, borderRadius: 15 },
  itemGestion: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#333' },
  footerModal: {
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#333',
    marginTop: 10,
    width: '100%',
    alignItems: 'center'
  },
});