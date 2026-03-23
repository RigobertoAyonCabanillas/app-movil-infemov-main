import React, { useContext, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Modal, TouchableOpacity } from 'react-native'; // Se añadió SafeAreaView
import { TextInput, Button, List, Divider, Text, Portal, Dialog, IconButton } from 'react-native-paper';
import { UserContext } from "@/components/UserContext";
import { useAuthService } from "@/servicesdb/authService";
import { gestionarSucursalesApi, actualizarPasswordApi } from "@/services/api";
import { router } from "expo-router";
// Importación necesaria para la lada
import CountryPicker, { Country } from 'react-native-country-picker-modal';
import { SafeAreaView } from 'react-native-safe-area-context';

const CuentaScreen = () => {
    const { users, setUsers } = useContext(UserContext);
    const { sincronizarActualizacionPerfil, actualizarGimnasioSeleccionado } = useAuthService();

    // --- ESTADOS DE PERFIL ---
    const [nombre, setNombre] = useState('');
    const [apellidoP, setApellidoP] = useState('');
    const [apellidoM, setApellidoM] = useState('');
    const [correo, setCorreo] = useState('');
    const [telefono, setTelefono] = useState('');
    const [expanded, setExpanded] = useState(false);

    // --- ESTADOS PARA LADA (AÑADIDOS) ---
    const [countryCode, setCountryCode] = useState<any>('MX');
    const [callingCode, setCallingCode] = useState('52');
    const [showCountryPicker, setShowCountryPicker] = useState(false);

    // --- ESTADOS DE SEGURIDAD (PASSWORD) ---
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [modalVisible, setModalVisible] = useState(false);

    // --- ESTADOS DE GIMNASIOS ---
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
            setTelefono(users.telefono || users.Telefono || "");

            // --- AÑADE ESTO AQUÍ PARA EL GIMNASIO ---
            const cargarNombreGym = async () => {
                // Si la lista está vacía, la traemos primero
                if (listaGimnasios.length === 0) {
                    const res = await gestionarSucursalesApi(users.correo || users.Correo);
                    if (res && res.Gimnasios) {
                        setListaGimnasios(res.Gimnasios);
                    }
                }
            };
            cargarNombreGym();
        }
    }, [users]);

    const handleGuardarPerfil = async () => {
        if (!nombre || !correo) {
            Alert.alert("Campos requeridos", "Nombre y Correo son obligatorios.");
            return;
        }
        setLoading(true);
        try {
            const nuevosDatos = {
                Nombre: nombre,
                ApellidoPaterno: apellidoP,
                ApellidoMaterno: apellidoM,
                Correo: correo,
                // Se concatena la lada al guardar
                Telefono: `+${callingCode}${telefono}` 
            };
            const res = await sincronizarActualizacionPerfil(users.id || users.Id, nuevosDatos);
            if (res.success) {
                setUsers((prev: any) => ({ ...prev, ...nuevosDatos, nombres: nombre }));
                Alert.alert("Éxito", res.message);
                setExpanded(false);
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "No se pudo actualizar el perfil.");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmarCambioPass = async () => {
        if (!oldPassword || !newPassword) {
            Alert.alert("Campos requeridos", "Por favor llena ambos campos.");
            return;
        }
        setLoading(true);
        try {
            const res = await actualizarPasswordApi(users.correo || users.Correo, oldPassword, newPassword);
            if (res) {
                Alert.alert("Seguridad Actualizada", "Tu contraseña ha sido cambiada. Inicia sesión de nuevo.", [
                    { text: "OK", onPress: () => { setUsers(null); router.replace("/"); } }
                ]);
                setModalVisible(false);
                setOldPassword('');
                setNewPassword('');
            }
        } catch (error: any) {
            Alert.alert("Error de Seguridad", error.message);
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
        } finally {
            setLoading(false);
        }
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

            // 1. Buscamos el nombre ANTES de la petición para tenerlo listo
            const gymSeleccionado = listaGimnasios.find(g => Number(g.Id || g.id) === gymId);
            const nombreGymNuevo = gymSeleccionado ? gymSeleccionado.Nombre : "Sucursal";

            const res = await actualizarGimnasioSeleccionado(gymId, userId, correoUsuario, password);

            if (res && res.Accion === "CambioExitoso") {
                // 2. Actualizamos el contexto localmente de forma inmediata
                // Usamos 'nombreGym' para que tu List.Item lo encuentre
                setUsers((prev: any) => ({
                    ...prev,
                    GimnasioActual: gymId,
                    nombreGym: nombreGymNuevo 
                }));

                // 3. Limpieza de interfaz
                setGymModalVisible(false);
                setPasswordCambio("");
                setGymSeleccionadoId(null);

                // 4. Navegación (como lo tenías antes)
                Alert.alert("Éxito", "Sucursal actualizada correctamente.");
                router.replace("/(tabs)/perfil"); 
            }
        } catch (error: any) {
            console.error("Error al cambiar gym:", error);
            Alert.alert("Error de Validación", error.message || "Contraseña incorrecta.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.headerProfile}>
                <Text style={styles.welcomeText}>Configuración de Cuenta</Text>
                <Text style={styles.subText}>{correo}</Text>
            </View>

            <List.Accordion
                title="Datos del Perfil"
                left={props => <List.Icon {...props} icon="account-cog" color="#99bc1a" />}
                expanded={expanded}
                onPress={() => setExpanded(!expanded)}
            >
                <View style={styles.formContainer}>
                    <TextInput label="Nombre" value={nombre} onChangeText={setNombre} mode="outlined" style={styles.input} activeOutlineColor="#99bc1a" />
                    <TextInput label="Apellido Paterno" value={apellidoP} onChangeText={setApellidoP} mode="outlined" style={styles.input} activeOutlineColor="#99bc1a" />
                    <TextInput label="Apellido Materno" value={apellidoM} onChangeText={setApellidoM} mode="outlined" style={styles.input} activeOutlineColor="#99bc1a" />
                    
                    {/* FILA DE TELÉFONO CON LADA */}
                    <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                        <TouchableOpacity 
                            onPress={() => setShowCountryPicker(true)}
                            style={styles.ladaSelector}
                        >
                            <Text style={{ fontSize: 16 }}>+{callingCode}</Text>
                        </TouchableOpacity>
                        <TextInput 
                            label="Teléfono" 
                            value={telefono} 
                            onChangeText={setTelefono} 
                            mode="outlined" 
                            keyboardType="numeric" 
                            style={{ flex: 1, backgroundColor: '#fff' }} 
                            activeOutlineColor="#99bc1a" 
                        />
                    </View>

                    <Button mode="contained" onPress={handleGuardarPerfil} loading={loading} buttonColor="#99bc1a" style={{ marginTop: 10 }}>
                        Guardar Perfil
                    </Button>
                </View>
            </List.Accordion>

            <Divider />

            <List.Item
                title="Seguridad"
                description="Cambiar contraseña"
                left={props => <List.Icon {...props} icon="lock" color="#555" />}
                onPress={() => setModalVisible(true)}
                right={props => <List.Icon {...props} icon="chevron-right" />}
            />

            <Divider />

           <List.Item
                title="Sucursal Actual"
                description={(() => {
                    // Obtenemos el ID del usuario (ej: 23)
                    const currentGymId = users?.GimnasioActual || users?.gymId || users?.IdGym;
                    
                    // Buscamos en la lista usando 'Id' con mayúscula como en tu JSON
                    const gymEncontrado = listaGimnasios?.find(g => Number(g.Id) === Number(currentGymId));
                    
                    if (gymEncontrado) {
                        // Usamos 'Nombre' con mayúscula como en tu JSON
                        return `${gymEncontrado.Nombre} (ID: ${currentGymId})`;
                    }
                    
                    return currentGymId ? `ID: ${currentGymId}` : "No seleccionada";
                })()}
                left={props => <List.Icon {...props} icon="store" color="#555" />}
                onPress={handleAbrirConfigGym}
                right={props => <List.Icon {...props} icon="chevron-right" />}
            />

            {/* MODAL LADA (SIN ENCABEZADO) */}
            <Modal visible={showCountryPicker} animationType="slide">
                <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
                    {/* Contenedor con margen superior para que el buscador no choque con la cámara */}
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
                            withFlag // Habilita las banderas en la lista
                            withEmoji // Asegura que se vean los iconos de bandera
                            withModal={false}
                            filterProps={{ 
                                autoFocus: true, 
                                placeholder: 'Buscar país...',
                            }}
                        />
                    </View>
                    <Button onPress={() => setShowCountryPicker(false)} textColor="#666">Cerrar</Button>
                </SafeAreaView>
            </Modal>

            {/* DIALOG PARA CAMBIO DE CONTRASEÑA */}
            <Portal>
                <Dialog visible={modalVisible} onDismiss={() => setModalVisible(false)}>
                    <Dialog.Title>Cambiar Contraseña</Dialog.Title>
                    <Dialog.Content>
                        <TextInput label="Contraseña Actual" value={oldPassword} onChangeText={setOldPassword} secureTextEntry mode="outlined" style={styles.input} activeOutlineColor="#99bc1a" />
                        <TextInput label="Nueva Contraseña" value={newPassword} onChangeText={setNewPassword} secureTextEntry mode="outlined" style={styles.input} activeOutlineColor="#99bc1a" />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setModalVisible(false)} textColor="#666">Cancelar</Button>
                        <Button onPress={handleConfirmarCambioPass} loading={loading} textColor="#99bc1a">Confirmar</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            {/* MODAL PARA SUCURSALES (INTACTO) */}
            <Modal visible={gymModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Seleccionar Sucursal</Text>
                        <ScrollView style={{ width: '100%' }}>
                            {listaGimnasios.map((gym) => {
                                const idEsteGym = Number(gym.Id || gym.id);
                                const idActual = Number(users?.gymId || users?.IdGym);
                                const esSeleccionado = gymSeleccionadoId === idEsteGym;

                                return (
                                    <View key={idEsteGym}>
                                        <TouchableOpacity 
                                            style={[styles.gymItem, esSeleccionado && { backgroundColor: '#f0f9eb' }]}
                                            onPress={() => setGymSeleccionadoId(idEsteGym)}
                                        >
                                            <Text style={{ fontWeight: esSeleccionado ? 'bold' : 'normal' }}>{gym.Nombre}</Text>
                                            {idEsteGym === idActual && <IconButton icon="check-circle" iconColor="#99bc1a" size={20} />}
                                        </TouchableOpacity>

                                        {esSeleccionado && idEsteGym !== idActual && (
                                            <View style={styles.passContainer}>
                                                <TextInput
                                                    label="Contraseña"
                                                    value={passwordCambio}
                                                    onChangeText={setPasswordCambio}
                                                    secureTextEntry
                                                    mode="outlined"
                                                    activeOutlineColor="#99bc1a"
                                                    style={{ marginBottom: 10, backgroundColor: '#fff' }}
                                                />
                                                <Button 
                                                    mode="contained" 
                                                    onPress={() => handleCambiarGym(idEsteGym, passwordCambio)}
                                                    loading={loading}
                                                    buttonColor="#99bc1a"
                                                >
                                                    Confirmar Cambio
                                                </Button>
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </ScrollView>
                        <Button onPress={() => { setGymModalVisible(false); setGymSeleccionadoId(null); setPasswordCambio(""); }}>Cerrar</Button>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    headerProfile: { padding: 40, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
    welcomeText: { fontSize: 20, fontWeight: 'bold' },
    subText: { color: '#666', marginTop: 5 },
    formContainer: { padding: 20, backgroundColor: '#fff' },
    input: { marginBottom: 10, backgroundColor: '#fff' },
    ladaSelector: { 
        justifyContent: 'center', 
        alignItems: 'center', 
        paddingHorizontal: 15, 
        borderWidth: 1, 
        borderColor: '#ccc', 
        borderRadius: 4, 
        marginRight: 10, 
        backgroundColor: '#fff',
        height: 56, // Altura para alinear con TextInput de Paper
        marginTop: 6
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    gymItem: { padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
    passContainer: { padding: 15, backgroundColor: '#f9f9f9', borderRadius: 8, marginVertical: 5 }
});

export default CuentaScreen;