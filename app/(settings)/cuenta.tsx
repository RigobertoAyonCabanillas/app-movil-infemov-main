import React, { useContext, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Modal, TouchableOpacity, StatusBar } from 'react-native';
import { TextInput, Button, List, Divider, Text, Portal, Dialog, IconButton } from 'react-native-paper';
import { UserContext } from "@/components/UserContext";
import { useAuthService } from "@/servicesdb/authService";
import { gestionarSucursalesApi, actualizarPasswordApi } from "@/services/api";
import { router } from "expo-router";
import CountryPicker, { Country } from 'react-native-country-picker-modal';
import { SafeAreaView } from 'react-native-safe-area-context';

// Paleta de colores Neón/Dark
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

    const [nombre, setNombre] = useState('');
    const [apellidoP, setApellidoP] = useState('');
    const [apellidoM, setApellidoM] = useState('');
    const [correo, setCorreo] = useState('');
    const [telefono, setTelefono] = useState('');
    const [expanded, setExpanded] = useState(false);

    const [countryCode, setCountryCode] = useState<any>('MX');
    const [callingCode, setCallingCode] = useState('52');
    const [showCountryPicker, setShowCountryPicker] = useState(false);

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [modalVisible, setModalVisible] = useState(false);

    const [gymModalVisible, setGymModalVisible] = useState(false);
    const [listaGimnasios, setListaGimnasios] = useState<any[]>([]);
    const [passwordCambio, setPasswordCambio] = useState("");
    const [gymSeleccionadoId, setGymSeleccionadoId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (users) {
            setNombre(users.nombres || users.Nombre || "");
            setApellidoP(users.apellidoPaterno || users.ApellidoPaterno || "");
            setApellidoM(users.apellidoMaterno || users.ApellidoMaterno || "");
            setCorreo(users.correo || users.Correo || "");

            const telDb = users.telefono || users.Telefono || "";
            const limpio = limpiarNumero(telDb, callingCode);
            setTelefono(limpio.slice(-10)); 

            const cargarNombreGym = async () => {
                if (listaGimnasios.length === 0) {
                    const res = await gestionarSucursalesApi(users.correo || users.Correo);
                    if (res && res.Gimnasios) setListaGimnasios(res.Gimnasios);
                }
            };
            cargarNombreGym();
        }
    }, [users, callingCode]);

    const limpiarNumero = (tel: any, code: any) => {
        if (!tel) return "";
        let soloNumeros = tel.replace(/\D/g, '');
        if (soloNumeros.startsWith(code)) soloNumeros = soloNumeros.slice(code.length);
        while (soloNumeros.startsWith(code) && soloNumeros.length > 10) {
            soloNumeros = soloNumeros.slice(code.length);
        }
        return soloNumeros;
    };

    const handleGuardarPerfil = async () => {
        const soloNumeros = telefono.replace(/[^0-9]/g, ''); 
        const numeroFinal = soloNumeros.slice(-10);

        if (!nombre || !correo) {
            Alert.alert("Campos requeridos", "Nombre y Correo son obligatorios.");
            return;
        }
        if (numeroFinal.length !== 10) {
            Alert.alert("Teléfono inválido", "El número debe tener 10 dígitos numéricos.");
            return;
        }

        setLoading(true);
        try {
            const nuevosDatos = {
                Nombre: nombre,
                ApellidoPaterno: apellidoP,
                ApellidoMaterno: apellidoM,
                Correo: correo,
                Telefono: `+${callingCode}${numeroFinal}` 
            };

            const res = await sincronizarActualizacionPerfil(users.id || users.Id, nuevosDatos);
            if (res.success) {
                setUsers((prev: any) => ({ ...prev, ...nuevosDatos, nombres: nombre }));
                Alert.alert("Éxito", "Perfil actualizado correctamente.");
                setExpanded(false);
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "No se pudo actualizar.");
        } finally { setLoading(false); }
    };

    const handleConfirmarCambioPass = async () => {
        // 1. Validación de campos vacíos
        if (!oldPassword || !newPassword) {
            Alert.alert("Campos requeridos", "Por favor llena ambos campos.");
            return;
        }

        // 2. Validación de complejidad (misma que el registro)
        const complejidadRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (newPassword.includes(" ") || !complejidadRegex.test(newPassword)) {
            Alert.alert(
                "Seguridad", 
                "La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número, sin espacios."
            );
            return;
        }

        // 3. Evitar que la nueva sea igual a la anterior (opcional, pero recomendado)
        if (oldPassword === newPassword) {
            Alert.alert("Seguridad", "La nueva contraseña no puede ser igual a la anterior.");
            return;
        }

        setLoading(true);
        try {
            const res = await actualizarPasswordApi(oldPassword, newPassword, users.token || users.Token);
            if (res) {
                const userId = users.id || users.Id || users.usuarioId;
                if (userId) await actualizarPassword(newPassword, userId);
                
                Alert.alert("Seguridad Actualizada", "Tu contraseña ha sido cambiada. Inicia sesión de nuevo.", [
                    { text: "OK", onPress: () => { setUsers(null); router.replace("/"); } }
                ]);
                
                setModalVisible(false);
                setOldPassword('');
                setNewPassword('');
            }
        } catch (error: any) {
            // Aquí el API mandará el error si la contraseña actual es incorrecta
            Alert.alert("Error de Seguridad", error.message || "No se pudo actualizar la contraseña.");
        } finally { 
            setLoading(false); 
        }
    };

    const handleAbrirConfigGym = async () => {
        setLoading(true);
        try {
            const res = await gestionarSucursalesApi(users?.correo || users?.Correo);
            if (res.Accion === "MostrarLista" && res.Gimnasios) {
                setListaGimnasios(res.Gimnasios);
                setGymModalVisible(true);
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "No se pudo cargar la lista.");
        } finally { setLoading(false); }
    };

    const handleCambiarGym = async (gymId: number, password: string) => {
        if (!password) {
            Alert.alert("Error", "Debes ingresar la contraseña.");
            return;
        }
        setLoading(true);
        try {
            const correoUsuario = users?.correo || users?.Correo;
            const userId = users?.id || users?.Id;
            const gymSeleccionado = listaGimnasios.find(g => Number(g.Id || g.id) === gymId);
            const nombreGymNuevo = gymSeleccionado ? gymSeleccionado.Nombre : "Sucursal";

            const res = await actualizarGimnasioSeleccionado(gymId, userId, correoUsuario, password);
            if (res && res.Accion === "CambioExitoso") {
                setUsers((prev: any) => ({ ...prev, GimnasioActual: gymId, nombreGym: nombreGymNuevo }));
                setGymModalVisible(false);
                setPasswordCambio("");
                setGymSeleccionadoId(null);
                Alert.alert("Éxito", "Sucursal actualizada correctamente.");
                router.replace("/(tabs)/perfil"); 
            }
        } catch (error: any) {
            Alert.alert("Error de Validación", error.message || "Contraseña incorrecta.");
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
                                <Text style={{ color: COLORS.textMain, fontSize: 16 }}>+{callingCode}</Text>
                            </TouchableOpacity>
                            <TextInput 
                                label="Teléfono" value={telefono} 
                                onChangeText={(text) => setTelefono(text.replace(/[^0-9]/g, ''))}
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
                    description={(() => {
                        const currentGymId = users?.GimnasioActual || users?.gymId || users?.IdGym;
                        const gymEncontrado = listaGimnasios?.find(g => Number(g.Id) === Number(currentGymId));
                        return gymEncontrado ? `${gymEncontrado.Nombre}` : "No seleccionada";
                    })()}
                    titleStyle={{ color: COLORS.textMain }}
                    descriptionStyle={{ color: COLORS.accent }}
                    left={props => <List.Icon {...props} icon="store" color={COLORS.textSub} />}
                    onPress={handleAbrirConfigGym}
                    right={props => <List.Icon {...props} icon="chevron-right" color={COLORS.divider} />}
                />
            </View>

            {/* Modal Lada */}
            <Modal visible={showCountryPicker} animationType="slide">
                <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
                    <View style={{ flex: 1, marginTop: 40 }}> 
                        <CountryPicker
                            countryCode={countryCode}
                            visible={showCountryPicker}
                            onSelect={(country: Country) => {
                                setCountryCode(country.cca2);
                                setCallingCode(country.callingCode[0]);
                                setShowCountryPicker(false);
                            }}
                            onClose={() => setShowCountryPicker(false)}
                            withFilter 
                            withFlag 
                            withEmoji 
                            withModal={false}
                            // Se corrigieron las propiedades del theme para evitar errores de TypeScript
                            theme={{
                                backgroundColor: COLORS.bg,
                                onBackgroundTextColor: COLORS.textMain, // Color del texto general
                                fontSize: 16,
                                filterPlaceholderTextColor: COLORS.textSub,
                                activeOpacity: 0.7,
                                itemHeight: 50,
                            }}
                        />
                    </View>
                    <Button 
                        onPress={() => setShowCountryPicker(false)} 
                        textColor={COLORS.accent}
                        style={{ marginBottom: 20 }}
                    >
                        Cerrar
                    </Button>
                </SafeAreaView>
            </Modal>

            {/* Dialog Password */}
            <Portal>
                <Dialog visible={modalVisible} onDismiss={() => setModalVisible(false)} style={{ backgroundColor: COLORS.cardBg }}>
                    <Dialog.Title style={{ color: COLORS.textMain }}>Seguridad</Dialog.Title>
                    <Dialog.Content>
                        <TextInput 
                            label="Contraseña Actual" 
                            value={oldPassword} 
                            onChangeText={setOldPassword} 
                            secureTextEntry 
                            mode="outlined" 
                            style={styles.input} 
                            activeOutlineColor={COLORS.accent}
                            outlineColor={COLORS.divider} // Color del borde cuando no está enfocado
                            textColor={COLORS.textMain}   // Color del texto que escribes
                            theme={{ 
                                colors: { 
                                    onSurfaceVariant: COLORS.textSub, // Color del Label (etiqueta)
                                    primary: COLORS.accent            // Color de acento
                                } 
                            }} 
                        />

                        <TextInput 
                            label="Nueva Contraseña" 
                            value={newPassword} 
                            onChangeText={setNewPassword} 
                            secureTextEntry 
                            mode="outlined" 
                            style={styles.input} 
                            activeOutlineColor={COLORS.accent}
                            outlineColor={COLORS.divider}
                            textColor={COLORS.textMain}
                            theme={{ 
                                colors: { 
                                    onSurfaceVariant: COLORS.textSub,
                                    primary: COLORS.accent 
                                } 
                            }}
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setModalVisible(false)} textColor={COLORS.textSub}>Cancelar</Button>
                        <Button onPress={handleConfirmarCambioPass} loading={loading} textColor={COLORS.accent}>Confirmar</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            {/* Modal Sucursales */}
            <Modal visible={gymModalVisible} animationType="fade" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Seleccionar Sucursal</Text>
                        <ScrollView style={{ width: '100%' }}>
                            {listaGimnasios.map((gym) => {
                                const idEsteGym = Number(gym.Id || gym.id);
                                const idActual = Number(users?.GimnasioActual || users?.gymId);
                                const esSeleccionado = gymSeleccionadoId === idEsteGym;

                                return (
                                    <View key={idEsteGym}>
                                        <TouchableOpacity 
                                            style={[styles.gymItem, esSeleccionado && { backgroundColor: '#1A1A1A' }]}
                                            onPress={() => setGymSeleccionadoId(idEsteGym)}
                                        >
                                            <Text style={{ color: esSeleccionado ? COLORS.accent : COLORS.textMain }}>{gym.Nombre}</Text>
                                            {idEsteGym === idActual && <IconButton icon="check-circle" iconColor={COLORS.accent} size={20} />}
                                        </TouchableOpacity>
                                        {esSeleccionado && idEsteGym !== idActual && (
                                            <View style={styles.passContainer}>
                                                <TextInput label="Contraseña" value={passwordCambio} onChangeText={setPasswordCambio} secureTextEntry mode="outlined" activeOutlineColor={COLORS.accent} style={styles.input} />
                                                <Button mode="contained" onPress={() => handleCambiarGym(idEsteGym, passwordCambio)} loading={loading} buttonColor={COLORS.accent} textColor="#000">Confirmar</Button>
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
        borderColor: COLORS.divider
    },
    accordion: { backgroundColor: COLORS.cardBg },
    formContainer: { padding: 20, backgroundColor: COLORS.cardBg },
    input: { marginBottom: 10, backgroundColor: COLORS.inputBg },
    mainBtn: { marginTop: 10, borderRadius: 8 },
    ladaSelector: { 
        justifyContent: 'center', 
        alignItems: 'center', 
        paddingHorizontal: 15, 
        borderWidth: 1, 
        borderColor: COLORS.divider, 
        borderRadius: 4, 
        marginRight: 10, 
        backgroundColor: COLORS.inputBg,
        height: 50,
        marginTop: 6
    },
    divider: { backgroundColor: COLORS.divider, height: 1 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 20, maxHeight: '80%', borderWidth: 1, borderColor: COLORS.divider },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 20, textAlign: 'center' },
    gymItem: { padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.divider },
    passContainer: { padding: 15, backgroundColor: '#000', borderRadius: 8, marginVertical: 10 }
});

export default CuentaScreen;