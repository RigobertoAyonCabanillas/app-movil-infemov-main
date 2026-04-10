import React, { useState, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserContext } from "@/components/UserContext"; 
import { obtenerMisClasesCoach, marcarAsistenciaCoach } from '@/services/api'; 
import { useFocusEffect } from 'expo-router';

// Interfaz para el tipado de los datos del servidor
interface ClaseCoach {
    id: number;
    fecha: string;
    horaIncio: string;
    horaFin: string;
    vacantes: number;
    tipoClase_ID: number;
    special: boolean | null;
    asistenciaCoach: boolean | null;
}

// Mapa de disciplinas proporcionado
export const MAPA_DISCIPLINAS: { [key: number]: string } = {
  1: 'Spinning', 2: 'Yoga', 3: 'Cardio', 4: 'Barre', 5: 'Zumba', 6: 'Zumba',
  7: 'Zumba', 8: 'Gimnasio', 9: 'Gimnasio', 1009: 'CrossFit', 1010: 'Cardio',
  1011: 'Cardio', 1012: 'Spinning', 1013: 'Pilates', 1014: 'Zumba', 2013: 'Ola',
  2014: 'Sdf', 3017: 'Spinning', 3018: 'Box', 3019: 'Spinning', 3020: 'Box', 4019: 'Capoeira'
};

export default function PaselistaScreen() {
    const { users } = useContext(UserContext);
    const [clases, setClases] = useState<ClaseCoach[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Estado para la fecha seleccionada (formato YYYY-MM-DD)
    const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);

    // Lógica para obtener los 7 días empezando desde el LUNES
    const obtenerDiasDeLaSemana = () => {
        const hoy = new Date();
        const diaSemana = hoy.getDay(); 
        const diferenciaAlLunes = diaSemana === 0 ? -6 : 1 - diaSemana; 
        
        const lunes = new Date(hoy);
        lunes.setDate(hoy.getDate() + diferenciaAlLunes);

        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(lunes);
            d.setDate(lunes.getDate() + i);
            return d;
        });
    };

    const diasSemana = obtenerDiasDeLaSemana();

    const cargarClases = async (superId: number) => {
        try {
            setLoading(true);
            const data = await obtenerMisClasesCoach(superId);
            if (data) setClases(data);
        } catch (error: any) {
            console.error("Error al cargar clases:", error.message);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            // Se utiliza gymId detectado en el contexto del coach
            const superId = users?.gymId || users?.GimnasioActual;
            if (superId) cargarClases(Number(superId));
        }, [users])
    );

    const handleMarcarAsistencia = async (claseId: number) => {
        try {
            await marcarAsistenciaCoach(claseId);
            Alert.alert("Éxito", "Asistencia registrada correctamente.");
            const superId = users?.gymId || users?.GimnasioActual;
            if (superId) cargarClases(Number(superId));
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    };

    // Filtra las clases que coinciden con el día seleccionado en el calendario superior
    const clasesFiltradas = clases.filter(c => c.fecha.split('T')[0] === fechaSeleccionada);

    return (
        <View style={styles.container}>
            <Text style={styles.headerTitle}>Gestión de Asistencias</Text>
            
            {/* Selector de 7 Días - Inicia en Lunes */}
            <View style={{ height: 100, marginBottom: 20 }}>
                <FlatList
                    horizontal
                    data={diasSemana}
                    keyExtractor={(item) => item.toISOString()}
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => {
                        const isoFecha = item.toISOString().split('T')[0];
                        const esActivo = fechaSeleccionada === isoFecha;
                        return (
                            <TouchableOpacity 
                                style={[styles.cardClase, esActivo && styles.cardActiva]}
                                onPress={() => setFechaSeleccionada(isoFecha)}
                            >
                                <Text style={[styles.diaTexto, esActivo && styles.textoNegro]}>
                                    {item.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase()}
                                </Text>
                                <Text style={[styles.numeroTexto, esActivo && styles.textoNegro]}>
                                    {item.getDate()}
                                </Text>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>

            {/* Listado de clases del día seleccionado */}
            <View style={styles.listaContainer}>
                {loading ? (
                    <ActivityIndicator color="#39FF14" size="large" style={{ marginTop: 50 }} />
                ) : clasesFiltradas.length > 0 ? (
                    <FlatList
                        data={clasesFiltradas}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <View style={styles.claseCard}>
                                <View style={styles.infoSeccion}>
                                    <Text style={styles.tipoClaseText}>
                                        {MAPA_DISCIPLINAS[item.tipoClase_ID] || "Clase General"}
                                    </Text>
                                    <Text style={styles.horarioText}>
                                        <Ionicons name="time-outline" size={14} color="#888" /> {item.horaIncio.substring(0, 5)} - {item.horaFin.substring(0, 5)}
                                    </Text>
                                </View>

                                <View style={styles.asistenciaSeccion}>
                                    <Text style={[styles.statusLabel, item.asistenciaCoach && { color: '#39FF14' }]}>
                                        {item.asistenciaCoach ? "CONFIRMADA" : "PENDIENTE"}
                                    </Text>
                                    <TouchableOpacity 
                                        style={[styles.botonAsistencia, item.asistenciaCoach && styles.botonCheck]}
                                        onPress={() => handleMarcarAsistencia(item.id)}
                                        disabled={!!item.asistenciaCoach}
                                    >
                                        <Ionicons 
                                            name={item.asistenciaCoach ? "checkmark-circle" : "finger-print"} 
                                            size={20} 
                                            color={item.asistenciaCoach ? "#39FF14" : "#000"} 
                                        />
                                        <Text style={[styles.btnTexto, { color: item.asistenciaCoach ? "#39FF14" : "#000" }]}>
                                            {item.asistenciaCoach ? "Registrada" : "Marcar"}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    />
                ) : (
                    <View style={styles.vacioContainer}>
                        <Ionicons name="calendar-outline" size={50} color="#333" />
                        <Text style={styles.vacioTexto}>No tienes clases para este día.</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', padding: 20 },
    headerTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginTop: 10 },
    cardClase: { backgroundColor: '#1A1A1A', padding: 12, borderRadius: 15, marginRight: 10, width: 75, height: 85, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#333' },
    cardActiva: { backgroundColor: '#39FF14', borderColor: '#39FF14' },
    diaTexto: { color: '#39FF14', fontWeight: 'bold', fontSize: 12 },
    numeroTexto: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginTop: 4 },
    textoNegro: { color: '#000' },
    listaContainer: { flex: 1 },
    claseCard: { backgroundColor: '#111', borderRadius: 20, padding: 18, marginBottom: 15, borderWidth: 1, borderColor: '#222', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    infoSeccion: { flex: 1 },
    tipoClaseText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
    horarioText: { color: '#888', fontSize: 14 },
    asistenciaSeccion: { alignItems: 'flex-end' },
    statusLabel: { color: '#555', fontSize: 10, marginBottom: 8, fontWeight: 'bold' },
    botonAsistencia: { flexDirection: 'row', backgroundColor: '#39FF14', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 25, alignItems: 'center', gap: 6 },
    botonCheck: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#333' },
    btnTexto: { fontWeight: 'bold', fontSize: 14 },
    vacioContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
    vacioTexto: { color: '#444', marginTop: 10, fontSize: 16 }
});