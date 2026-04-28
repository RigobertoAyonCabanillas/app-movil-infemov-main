import { Text, View, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, ActivityIndicator, Dimensions, Image } from "react-native";
import React, { useContext, useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { IconButton } from 'react-native-paper';
import { UserContext } from "@/components/UserContext";
import { useAuthService } from "@/servicesdb/authService";
import { useFocusEffect } from 'expo-router'; 
import { MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

// Librería para detección dinámica de países
import { getAllCountries, FlagType, Country } from 'react-native-country-picker-modal';

import { generarQrUsuario, verificarEstadoQr } from '@/services/api'; 

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BRAND_PINK = '#FF3CAC';
const BRAND_GREEN = '#39FF14';

const InfoCard = ({ icon, label, value, children }: { icon: string, label: string, value?: string, children?: React.ReactNode }) => (
    <View style={styles.neonCard}>
        <View style={styles.neonIconContainer}>
            <IconButton icon={icon} iconColor={BRAND_GREEN} size={24} />
        </View>
        <View style={styles.textContainer}>
            <Text style={styles.neonCardLabel}>{label}</Text>
            {children ? children : <Text style={styles.neonCardValue}>{value || "No disponible"}</Text>}
        </View>
    </View>
);

export default function Perfil() {
    const { users } = useContext(UserContext);
    const { sincronizarPerfil } = useAuthService();
    
    const [qrVisible, setQrVisible] = useState(false);
    const [tokenQr, setTokenQr] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [listaPaises, setListaPaises] = useState<Country[]>([]);
    
    const tiempoCreacionRef = useRef<number>(0);
    const esCoach = users?.rol === 'Coach';

    // 1. Carga asíncrona de países (Corregido para evitar el error de Promise)
    useEffect(() => {
        const cargarDataPaises = async () => {
            try {
                const countries = await getAllCountries(FlagType.FLAT);
                setListaPaises(countries);
            } catch (e) {
                console.error("Error al cargar países:", e);
            }
        };
        cargarDataPaises();
    }, []);

    // 2. Lógica dinámica para detectar lada y bandera usando la librería
    const infoTel = useMemo(() => {
        const fullNumber = users?.telefono || users?.Telefono || "";
        if (!fullNumber.startsWith('+')) return { lada: '52', iso: 'mx', numero: fullNumber };

        const limpio = fullNumber.replace('+', '');
        const numeroCuerpo = limpio.slice(-10); 
        const ladaExtraida = limpio.slice(0, limpio.length - 10);

        const countryMatch = listaPaises.find(c => 
            c.callingCode.some(code => code === ladaExtraida)
        );
        
        return {
            lada: ladaExtraida,
            iso: countryMatch ? countryMatch.cca2.toLowerCase() : 'mx',
            numero: numeroCuerpo.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3")
        };
    }, [users?.telefono, listaPaises]);

    useEffect(() => {
        let intervalo: any;
        if (qrVisible && tokenQr) {
            intervalo = setInterval(async () => {
                try {
                    const data = await verificarEstadoQr(tokenQr);
                    if (data && data.escaneado === true) {
                        setQrVisible(false); 
                        setTokenQr(null);
                        clearInterval(intervalo);
                        Alert.alert("Acceso Confirmado", data.mensaje || "¡Bienvenido a Fixskale!");
                    }
                } catch (error) {
                    console.log("Esperando validación...");
                }
            }, 3000); 
        }
        return () => { if (intervalo) clearInterval(intervalo); };
    }, [qrVisible, tokenQr]);

    const manejarGenerarQr = async () => {
        try {
            setLoading(true);
            setTokenQr(null); 
            const data = await generarQrUsuario();
            if (data && data.token) {
                tiempoCreacionRef.current = Date.now();
                setTokenQr(data.token);
                setQrVisible(true);
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "No se pudo generar el QR");
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
        <View style={styles.mainContainer}>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                <View style={styles.headerSection}>
                    <Text style={styles.neonMainTitle}>Perfil Usuario</Text>
                    <Text style={styles.neonSubTitle}>Fixskale: Tu información personal</Text>
                </View>

                <View style={styles.contentWrapper}>
                    <InfoCard icon="account-outline" label="Nombre" value={users?.nombres} />
                    <InfoCard icon="account-details-outline" label="Apellido Paterno" value={users?.apellidoPaterno} />
                    <InfoCard icon="account-details-outline" label="Apellido Materno" value={users?.apellidoMaterno} />
                    <InfoCard icon="email-outline" label="Correo" value={users?.correo} />
                    
                    <InfoCard icon="phone-outline" label="Teléfono">
                        <View style={styles.phoneRow}>
                            <Image 
                                source={{ uri: `https://flagcdn.com/w40/${infoTel.iso}.png` }} 
                                style={styles.flagStyle} 
                            />
                            <Text style={styles.ladaText}>+{infoTel.lada}</Text>
                            <Text style={styles.neonCardValue}>{infoTel.numero}</Text>
                        </View>
                    </InfoCard>
                </View>
                
                <View style={{ height: 120 }} />
            </ScrollView>

            {!esCoach && (
                <TouchableOpacity 
                    style={[styles.neonFab, loading && { opacity: 0.6 }]}
                    onPress={manejarGenerarQr}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={BRAND_PINK} />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="qrcode" size={28} color={BRAND_PINK} />
                            <Text style={styles.neonFabText}>Generar QR de Entrada</Text>
                        </>
                    )}
                </TouchableOpacity>
            )}

            <Modal
                animationType="fade"
                transparent={true}
                visible={qrVisible}
                onRequestClose={() => { setQrVisible(false); setTokenQr(null); }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.neonModalContent}>
                        <TouchableOpacity style={styles.closeButton} onPress={() => { setQrVisible(false); setTokenQr(null); }}>
                            <MaterialCommunityIcons name="close" size={28} color={BRAND_PINK} />
                        </TouchableOpacity>

                        <Text style={styles.neonModalTitle}>Mi Pase de Entrada</Text>
                        <Text style={styles.neonModalSub}>Presenta este código al Coach en Fixskale</Text>
                        
                        <View style={styles.neonQrWrapper}>
                            {tokenQr && <QRCode value={tokenQr} size={200} color="black" backgroundColor="white" />}
                        </View>

                        <Text style={styles.neonUserNameText}>{users?.nombres} {users?.apellidoPaterno}</Text>
                        <Text style={styles.neonUserSubText}>ID: {users?.id || users?.Id}</Text>

                        {/* RESTAURADO: Símbolo de espera y texto de estado */}
                        <View style={{ marginTop: 25, flexDirection: 'row', alignItems: 'center' }}>
                            <ActivityIndicator size="small" color={BRAND_GREEN} />
                            <Text style={{ marginLeft: 10, color: BRAND_GREEN, fontSize: 12, opacity: 0.8 }}>
                                Esperando escaneo en el centro deportivo...
                            </Text>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#000000' },
    headerSection: { marginTop: 50, marginBottom: 30, paddingHorizontal: 25, alignItems: 'center' },
    neonMainTitle: { fontSize: 34, color: BRAND_PINK, fontWeight: 'bold' },
    neonSubTitle: { fontSize: 14, color: '#888', marginTop: 5, textAlign: 'center' },
    contentWrapper: { paddingHorizontal: 15, width: SCREEN_WIDTH, alignItems: 'center' },
    neonCard: {
        backgroundColor: '#080808', borderRadius: 15, paddingVertical: 15, paddingHorizontal: 20,
        marginBottom: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5,
        borderColor: BRAND_GREEN, width: SCREEN_WIDTH * 0.9, alignSelf: 'center'
    },
    neonIconContainer: { backgroundColor: 'rgba(57, 255, 20, 0.05)', borderRadius: 10, marginRight: 15 },
    textContainer: { flex: 1 },
    neonCardLabel: { fontSize: 10, color: BRAND_GREEN, fontWeight: 'bold', marginBottom: 2, opacity: 0.8 },
    neonCardValue: { fontSize: 16, color: '#FFFFFF', fontWeight: '600' },
    phoneRow: { flexDirection: 'row', alignItems: 'center' },
    flagStyle: { width: 22, height: 15, marginRight: 8, borderRadius: 2 },
    ladaText: { color: BRAND_GREEN, fontWeight: 'bold', marginRight: 10, fontSize: 16 },
    neonFab: {
        position: 'absolute', bottom: 30, right: SCREEN_WIDTH * 0.05, left: SCREEN_WIDTH * 0.05,
        width: SCREEN_WIDTH * 0.9, backgroundColor: '#000', flexDirection: 'row', height: 60,
        borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: BRAND_PINK
    },
    neonFabText: { color: BRAND_PINK, fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
    neonModalContent: {
        width: '85%', backgroundColor: '#050505', borderRadius: 25, padding: 30, 
        alignItems: 'center', borderWidth: 2, borderColor: BRAND_GREEN
    },
    closeButton: { alignSelf: 'flex-end', marginBottom: -10 },
    neonModalTitle: { fontSize: 22, fontWeight: 'bold', color: BRAND_GREEN, marginTop: 10 },
    neonModalSub: { fontSize: 13, color: '#666', marginBottom: 25 },
    neonQrWrapper: { padding: 15, backgroundColor: 'white', borderRadius: 15, marginTop: 20 },
    neonUserNameText: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginTop: 20 },
    neonUserSubText: { fontSize: 12, color: BRAND_GREEN, marginTop: 5, opacity: 0.9 }
});