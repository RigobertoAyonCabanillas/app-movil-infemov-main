import { Text, View, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, ActivityIndicator } from "react-native";
import React, { useContext, useCallback, useState, useEffect, useRef } from 'react';
import { IconButton } from 'react-native-paper';
import { UserContext } from "@/components/UserContext";
import { useAuthService } from "@/servicesdb/authService";
import { useFocusEffect } from 'expo-router'; 
import { MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

// Importación de tus servicios
import { generarQrUsuario, validarQrUsuario } from '@/services/api'; 

const InfoCard = ({ icon, label, value }: { icon: string, label: string, value?: string }) => (
    <View style={styles.card}>
        <View style={styles.iconContainer}>
            <IconButton icon={icon} iconColor="#99bc1a" size={24} />
        </View>
        <View style={styles.textContainer}>
            <Text style={styles.cardLabel}>{label}</Text>
            <Text style={styles.cardValue}>{value || "No disponible"}</Text>
        </View>
    </View>
);

export default function Perfil() {
    const { users } = useContext(UserContext);
    const { sincronizarPerfil } = useAuthService();
    
    const [qrVisible, setQrVisible] = useState(false);
    const [tokenQr, setTokenQr] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    
    // Usamos una referencia para marcar cuándo se generó el QR
    const tiempoCreacionRef = useRef<number>(0);

    const esCoach = users?.rol === 'Coach';

    // --- LÓGICA DE MONITOREO CON PROTECCIÓN ---
    useEffect(() => {
        let intervalo: any;

        if (qrVisible && tokenQr) {
            intervalo = setInterval(async () => {
                try {
                    const ahora = Date.now();
                    
                    // IGNORAR VALIDACIÓN si han pasado menos de 5 segundos
                    // Esto evita que se cierre por la respuesta inicial del backend
                    if (ahora - tiempoCreacionRef.current < 5000) {
                        return; 
                    }

                    const data = await validarQrUsuario(tokenQr);

                    // Si llega aquí y han pasado más de 5 seg, asumimos que es el escaneo real
                    if (data) {
                        setQrVisible(false); 
                        setTokenQr(null);
                        Alert.alert("Acceso Confirmado", data.mensaje || "¡Bienvenido!");
                    }
                } catch (error) {
                    // Si falla la validación, simplemente sigue esperando
                    console.log("Esperando escaneo...");
                }
            }, 3000); 
        }

        return () => {
            if (intervalo) clearInterval(intervalo);
        };
    }, [qrVisible, tokenQr]);

    const manejarGenerarQr = async () => {
        try {
            setLoading(true);
            setTokenQr(null); 
            
            const data = await generarQrUsuario();
            
            if (data && data.token) {
                tiempoCreacionRef.current = Date.now(); // Guardamos el momento exacto
                setTokenQr(data.token);
                setQrVisible(true);
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "No se pudo generar el código QR");
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            const currentId = users?.id || users?.Id;
            const currentCorreo = users?.correo || users?.Correo;
            if (currentId && currentCorreo) {
                const timeout = setTimeout(() => {
                    sincronizarPerfil(currentId, currentCorreo).catch(console.error);
                }, 500); 
                return () => clearTimeout(timeout);
            }
        }, [users?.id])
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#FBFBFE' }}>
            <ScrollView style={styles.mainContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.headerSection}>
                    <Text style={styles.mainTitle}>Perfil Usuario</Text>
                    <Text style={styles.subTitle}>Gestiona tu información personal</Text>
                </View>

                <View style={styles.cardsContainer}>
                    <InfoCard icon="account-outline" label="Nombre" value={users?.nombres} />
                    <InfoCard icon="account-details-outline" label="Apellido Paterno" value={users?.apellidoPaterno} />
                    <InfoCard icon="account-details-outline" label="Apellido Materno" value={users?.apellidoMaterno} />
                    <InfoCard icon="email-outline" label="Correo" value={users?.correo} />
                    <InfoCard icon="phone-outline" label="Teléfono" value={users?.telefono} />
                </View>
                
                <View style={{ height: 120 }} />
            </ScrollView>

            {!esCoach && (
                <TouchableOpacity 
                    style={[styles.fab, loading && { opacity: 0.8 }]}
                    onPress={manejarGenerarQr}
                    activeOpacity={0.8}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="qrcode" size={28} color="white" />
                            <Text style={styles.fabText}>Generar QR de Entrada</Text>
                        </>
                    )}
                </TouchableOpacity>
            )}

            <Modal
                animationType="fade"
                transparent={true}
                visible={qrVisible}
                onRequestClose={() => {
                    setQrVisible(false);
                    setTokenQr(null);
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity 
                            style={styles.closeButton} 
                            onPress={() => {
                                setQrVisible(false);
                                setTokenQr(null);
                            }}
                        >
                            <MaterialCommunityIcons name="close" size={28} color="#333" />
                        </TouchableOpacity>

                        <Text style={styles.modalTitle}>Mi Pase de Entrada</Text>
                        <Text style={styles.modalSub}>Presenta este código al Coach</Text>
                        
                        <View style={styles.qrWrapper}>
                            {tokenQr && (
                                <QRCode
                                    value={tokenQr}
                                    size={220}
                                    color="black"
                                    backgroundColor="white"
                                />
                            )}
                        </View>

                        <Text style={styles.userNameText}>
                            {users?.nombres} {users?.apellidoPaterno}
                        </Text>
                        <Text style={styles.userSubText}>ID: {users?.id || users?.Id}</Text>

                        <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center' }}>
                            <ActivityIndicator size="small" color="#99bc1a" />
                            <Text style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>
                                Esperando escaneo del Coach...
                            </Text>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: { flex: 1 },
    headerSection: { marginTop: 30, marginBottom: 30, paddingHorizontal: 25 },
    mainTitle: { fontSize: 42, color: '#99bc1a', fontWeight: 'bold', letterSpacing: -1 },
    subTitle: { fontSize: 16, color: '#888', marginTop: -5 },
    cardsContainer: { paddingHorizontal: 20, gap: 5 },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingVertical: 12,
        paddingHorizontal: 15,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    iconContainer: { backgroundColor: '#F5F9E5', borderRadius: 12, marginRight: 15 },
    textContainer: { flex: 1 },
    cardLabel: { fontSize: 12, color: '#AAA', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 2 },
    cardValue: { fontSize: 17, color: '#333', fontWeight: '600' },
    fab: {
        position: 'absolute', bottom: 30, right: 20, left: 20,
        backgroundColor: '#99bc1a', flexDirection: 'row', height: 60,
        borderRadius: 30, justifyContent: 'center', alignItems: 'center',
        elevation: 8, shadowColor: '#99bc1a', shadowOpacity: 0.3,
    },
    fabText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center', alignItems: 'center'
    },
    modalContent: {
        width: '85%', backgroundColor: 'white', borderRadius: 30,
        padding: 30, alignItems: 'center', elevation: 20
    },
    closeButton: { alignSelf: 'flex-end', marginBottom: -10 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginTop: 10 },
    modalSub: { fontSize: 14, color: '#666', marginBottom: 25 },
    qrWrapper: {
        padding: 15, backgroundColor: 'white', borderRadius: 20,
        borderWidth: 1, borderColor: '#eee', elevation: 2
    },
    userNameText: { fontSize: 18, fontWeight: '600', color: '#99bc1a', marginTop: 20 },
    userSubText: { fontSize: 12, color: '#999', marginTop: 5 }
});