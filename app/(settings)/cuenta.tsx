import React, { useContext, useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert, Modal, TouchableOpacity, StatusBar } from 'react-native';
import { TextInput, Button, List, Divider, Text, Portal, Dialog, IconButton } from 'react-native-paper';
import { UserContext } from "@/components/UserContext";
import { useAuthService } from "@/servicesdb/authService";
import { gestionarSucursalesApi, actualizarPasswordApi } from "@/services/api";
import { router } from "expo-router";
import CountryPicker, { Country } from 'react-native-country-picker-modal';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  bg: '#000000',
  cardBg: '#222121',
  accent: '#39FF14', 
  textMain: '#FFFFFF',
  textSub: '#A0A0A0',
  divider: '#2C2C2C',
  inputBg: '#1E1E1E'
};

const CuentaScreen = () => {
    const { users, setUsers } = useContext(UserContext);
    const { sincronizarActualizacionPerfil, actualizarGimnasioSeleccionado, actualizarPassword } = useAuthService();

    // Estados de formulario
    const [nombre, setNombre] = useState('');
    const [apellidoP, setApellidoP] = useState('');
    const [apellidoM, setApellidoM] = useState('');
    const [correo, setCorreo] = useState('');
    const [telefono, setTelefono] = useState('');
    const [expanded, setExpanded] = useState(false);

    // Estados de localización
    const [countryCode, setCountryCode] = useState<any>('MX');
    const [callingCode, setCallingCode] = useState('52');
    const [showCountryPicker, setShowCountryPicker] = useState(false);

    // Estados de seguridad
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [modalVisible, setModalVisible] = useState(false);

    // Estados de sucursal
    const [gymModalVisible, setGymModalVisible] = useState(false);
    const [listaGimnasios, setListaGimnasios] = useState<any[]>([]);
    const [passwordCambio, setPasswordCambio] = useState("");
    const [gymSeleccionadoId, setGymSeleccionadoId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    // 1. Carga inicial de datos
    useEffect(() => {
        if (users) {
            setNombre(users.nombres || users.Nombre || "");
            setApellidoP(users.apellidoPaterno || users.ApellidoPaterno || "");
            setApellidoM(users.apellidoMaterno || users.ApellidoMaterno || "");
            setCorreo(users.correo || users.Correo || "");

            // Limpieza de teléfono para mostrar solo los 10 dígitos
            const telDb = users.telefono || users.Telefono || "";
            const soloNumeros = telDb.replace(/\D/g, '');
            setTelefono(soloNumeros.slice(-10)); 

            const cargarSucursales = async () => {
                try {
                    const res = await gestionarSucursalesApi(users.correo || users.Correo);
                    if (res && res.Gimnasios) setListaGimnasios(res.Gimnasios);
                } catch (e) { console.error("Error sucursales:", e); }
            };
            cargarSucursales();
        }
    }, [users]);

    // 2. Obtener el nombre del gimnasio actual (Memoizado para rendimiento)
    const nombreGymActual = useMemo(() => {
        const idActual = users?.GimnasioActual || users?.gymId || users?.IdGym;
        if (!idActual || listaGimnasios.length === 0) return "No seleccionada";
        const gym = listaGimnasios.find(g => Number(g.Id || g.id) === Number(idActual));
        return gym ? gym.Nombre : "Cargando...";
    }, [users, listaGimnasios]);

    const handleGuardarPerfil = async () => {
        const numeroLimpio = telefono.replace(/[^0-9]/g, '').slice(-10);

        if (!nombre || !correo) {
            Alert.alert("Campos requeridos", "Nombre y Correo son obligatorios.");
            return;
        }
        if (numeroLimpio.length !== 10) {
            Alert.alert("Error", "El teléfono debe ser de 10 dígitos.");
            return;
        }

        setLoading(true);
        try {
            const nuevosDatos = {
                Nombre: nombre,
                ApellidoPaterno: apellidoP,
                ApellidoMaterno: apellidoM,
                Correo: correo,
                Telefono: `+${callingCode}${numeroLimpio}` 
            };

            const res = await sincronizarActualizacionPerfil(users.id || users.Id, nuevosDatos);
            if (res.success) {
                setUsers((prev: any) => ({ ...prev, ...nuevosDatos, nombres: nombre }));
                Alert.alert("Éxito", "Perfil actualizado.");
                setExpanded(false);
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "No se pudo actualizar.");
        } finally { setLoading(false); }
    };

    const handleConfirmarCambioPass = async () => {
        const complejidadRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!complejidadRegex.test(newPassword)) {
            Alert.alert("Seguridad", "La contraseña debe tener 8+ caracteres, mayúscula, minúscula y número.");
            return;
        }

        setLoading(true);
        try {
            const res = await actualizarPasswordApi(oldPassword, newPassword, users.token || users.Token);
            if (res) {
                await actualizarPassword(newPassword, users.id || users.Id);
                Alert.alert("Éxito", "Contraseña cambiada. Por seguridad, inicia sesión de nuevo.", [
                    { text: "OK", onPress: () => { setUsers(null); router.replace("/"); } }
                ]);
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "Error al cambiar contraseña.");
        } finally { setLoading(false); }
    };

    const handleCambiarGym = async (gymId: number, password: string) => {
        if (!password) {
            Alert.alert("Error", "Ingresa tu contraseña para confirmar.");
            return;
        }
        setLoading(true);
        try {
            const res = await actualizarGimnasioSeleccionado(gymId, users.id || users.Id, users.correo || users.Correo, password);
            if (res && res.Accion === "CambioExitoso") {
                setUsers((prev: any) => ({ ...prev, GimnasioActual: gymId, gymId: gymId }));
                setGymModalVisible(false);
                setPasswordCambio("");
                Alert.alert("Éxito", "Sucursal cambiada correctamente.");
            }
        } catch (error: any) {
            Alert.alert("Error", "Contraseña incorrecta o error de conexión.");
        } finally { setLoading(false); }
    };

    return (
        <ScrollView style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            <View style={styles.headerProfile}>
                <Text style={styles.welcomeText}>Configuración de Cuenta</Text>
                <Text style={styles.subText}>{correo}</Text>
            </View>

            <View style={styles.sectionCard}>
                <List.Accordion
                    title="Datos del Perfil"
                    left={props => <List.Icon {...props} icon="account-cog" color={COLORS.accent} />}
                    expanded={expanded}
                    onPress={() => setExpanded(!expanded)}
                    style={styles.accordion}
                    titleStyle={{ color: COLORS.textMain }}
                >
                    <View style={styles.formContainer}>
                        <TextInput label="Nombre" value={nombre} onChangeText={setNombre} mode="outlined" style={styles.input} outlineColor={COLORS.divider} activeOutlineColor={COLORS.accent} textColor={COLORS.textMain} />
                        <TextInput label="Apellido Paterno" value={apellidoP} onChangeText={setApellidoP} mode="outlined" style={styles.input} outlineColor={COLORS.divider} activeOutlineColor={COLORS.accent} textColor={COLORS.textMain} />
                        <TextInput label="Apellido Materno" value={apellidoM} onChangeText={setApellidoM} mode="outlined" style={styles.input} outlineColor={COLORS.divider} activeOutlineColor={COLORS.accent} textColor={COLORS.textMain} />
                        
                        <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                            <TouchableOpacity onPress={() => setShowCountryPicker(true)} style={styles.ladaSelector}>
                                <Text style={{ color: COLORS.textMain }}>+{callingCode}</Text>
                            </TouchableOpacity>
                            <TextInput 
                                label="Teléfono" value={telefono} 
                                onChangeText={(t) => setTelefono(t.replace(/[^0-9]/g, ''))}
                                mode="outlined" keyboardType="numeric" maxLength={10}
                                style={{ flex: 1, backgroundColor: COLORS.inputBg }} 
                                outlineColor={COLORS.divider} activeOutlineColor={COLORS.accent} textColor={COLORS.textMain}
                            />
                        </View>

                        <Button mode="contained" onPress={handleGuardarPerfil} loading={loading} buttonColor={COLORS.accent} textColor="#000" style={styles.mainBtn}>
                            Guardar Perfil
                        </Button>
                    </View>
                </List.Accordion>

                <Divider style={styles.divider} />

                <List.Item
                    title="Seguridad"
                    description="Cambiar contraseña"
                    titleStyle={{ color: COLORS.textMain }}
                    descriptionStyle={{ color: COLORS.textSub }}
                    left={props => <List.Icon {...props} icon="lock" color={COLORS.textSub} />}
                    onPress={() => setModalVisible(true)}
                    right={props => <List.Icon {...props} icon="chevron-right" color={COLORS.divider} />}
                />

                <Divider style={styles.divider} />

                <List.Item
                    title="Sucursal Actual"
                    description={nombreGymActual}
                    titleStyle={{ color: COLORS.textMain }}
                    descriptionStyle={{ color: COLORS.accent, fontWeight: 'bold' }}
                    left={props => <List.Icon {...props} icon="store" color={COLORS.textSub} />}
                    onPress={() => setGymModalVisible(true)}
                    right={props => <List.Icon {...props} icon="chevron-right" color={COLORS.divider} />}
                />
            </View>

            {/* Modal de Sucursales */}
            <Modal visible={gymModalVisible} animationType="fade" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Cambiar Sucursal</Text>
                        <ScrollView>
                            {listaGimnasios.map((gym) => {
                                const idGym = Number(gym.Id || gym.id);
                                const idAct = Number(users?.GimnasioActual || users?.gymId);
                                const isSelected = gymSeleccionadoId === idGym;

                                return (
                                    <View key={idGym} style={{ marginBottom: 5 }}>
                                        <TouchableOpacity 
                                            style={[styles.gymItem, isSelected && { borderColor: COLORS.accent, backgroundColor: '#1A1A1A' }]}
                                            onPress={() => setGymSeleccionadoId(idGym)}
                                        >
                                            <Text style={{ color: isSelected ? COLORS.accent : COLORS.textMain }}>{gym.Nombre}</Text>
                                            {idGym === idAct && <IconButton icon="check-circle" iconColor={COLORS.accent} size={20} />}
                                        </TouchableOpacity>

                                        {isSelected && idGym !== idAct && (
                                            <View style={styles.passConfirmBox}>
                                                <TextInput 
                                                    label="Contraseña de usuario" 
                                                    value={passwordCambio} 
                                                    onChangeText={setPasswordCambio} 
                                                    secureTextEntry 
                                                    mode="outlined" 
                                                    activeOutlineColor={COLORS.accent}
                                                    style={styles.input}
                                                />
                                                <Button mode="contained" onPress={() => handleCambiarGym(idGym, passwordCambio)} loading={loading} buttonColor={COLORS.accent} textColor="#000">
                                                    Confirmar Cambio
                                                </Button>
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </ScrollView>
                        <Button onPress={() => { setGymModalVisible(false); setGymSeleccionadoId(null); }} textColor={COLORS.textSub}>Cerrar</Button>
                    </View>
                </View>
            </Modal>

            {/* Dialog Seguridad */}
            <Portal>
                <Dialog visible={modalVisible} onDismiss={() => setModalVisible(false)} style={{ backgroundColor: COLORS.cardBg }}>
                    <Dialog.Title style={{ color: COLORS.textMain }}>Actualizar Contraseña</Dialog.Title>
                    <Dialog.Content>
                        <TextInput label="Contraseña Actual" value={oldPassword} onChangeText={setOldPassword} secureTextEntry mode="outlined" style={styles.input} activeOutlineColor={COLORS.accent} outlineColor={COLORS.divider} textColor={COLORS.textMain} />
                        <TextInput label="Nueva Contraseña" value={newPassword} onChangeText={setNewPassword} secureTextEntry mode="outlined" style={styles.input} activeOutlineColor={COLORS.accent} outlineColor={COLORS.divider} textColor={COLORS.textMain} />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setModalVisible(false)} textColor={COLORS.textSub}>Cancelar</Button>
                        <Button onPress={handleConfirmarCambioPass} loading={loading} textColor={COLORS.accent}>Confirmar</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            {/* Selector de País */}
            <Modal visible={showCountryPicker} animationType="slide">
                <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
                    <View style={{ flex: 1, marginTop: 20 }}>
                        <CountryPicker
                            countryCode={countryCode}
                            visible={showCountryPicker}
                            onSelect={(c) => { setCountryCode(c.cca2); setCallingCode(c.callingCode[0]); setShowCountryPicker(false); }}
                            onClose={() => setShowCountryPicker(false)}
                            withFilter withFlag withEmoji withModal={false}
                            theme={{ backgroundColor: COLORS.bg, onBackgroundTextColor: COLORS.textMain }}
                        />
                    </View>
                    <Button onPress={() => setShowCountryPicker(false)} textColor={COLORS.accent}>Cerrar</Button>
                </SafeAreaView>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    headerProfile: { padding: 40, alignItems: 'center' },
    welcomeText: { fontSize: 22, fontWeight: 'bold', color: COLORS.textMain },
    subText: { color: COLORS.textSub, marginTop: 5 },
    sectionCard: {
        backgroundColor: COLORS.cardBg,
        marginHorizontal: 15,
        borderRadius: 15,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.divider,
        marginBottom: 20
    },
    accordion: { backgroundColor: COLORS.cardBg },
    formContainer: { padding: 20, backgroundColor: COLORS.cardBg },
    input: { marginBottom: 10, backgroundColor: COLORS.inputBg },
    mainBtn: { marginTop: 10, borderRadius: 8 },
    ladaSelector: { 
        justifyContent: 'center', alignItems: 'center', paddingHorizontal: 15, 
        borderWidth: 1, borderColor: COLORS.divider, borderRadius: 4, 
        marginRight: 10, backgroundColor: COLORS.inputBg, height: 50, marginTop: 6
    },
    divider: { backgroundColor: COLORS.divider, height: 1 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 20, maxHeight: '80%', borderWidth: 1, borderColor: COLORS.divider },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 20, textAlign: 'center' },
    gymItem: { padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.divider, borderRadius: 8, borderWidth: 1, borderColor: 'transparent' },
    passConfirmBox: { padding: 15, backgroundColor: '#111', borderRadius: 12, marginVertical: 10, borderWidth: 1, borderColor: '#333' }
});

export default CuentaScreen;