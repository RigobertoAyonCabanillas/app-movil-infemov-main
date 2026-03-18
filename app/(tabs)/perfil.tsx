import { Text, View, Alert, Modal, TouchableOpacity, StyleSheet, ScrollView} from "react-native";
import React, { useContext, useCallback, useState, useLayoutEffect } from 'react';
import { 
    ContainerPerfil, Title, InfoSection, 
    InfoRow, Label, Value,
    ModalContainer, ModalContent, InputModal 
} from "@/styles/perfilStyle";
import { IconButton, Divider, List, Button, TextInput } from 'react-native-paper';
import { UserContext } from "@/components/UserContext";
import { useAuthService } from "@/servicesdb/authService";
import { useFocusEffect, useNavigation } from 'expo-router'; 
import { cerrarSesionUniversal } from '../../services/authgoogle'; 
import { router } from "expo-router";
import { actualizarPasswordApi, gestionarSucursalesApi } from "@/services/api";

export default function Perfil() {
    const { users, setUsers } = useContext(UserContext);
    // Extraemos la nueva función de sincronización del servicio
    const { sincronizarPerfil, obtenerUsuarioLocal, actualizarPassword, sincronizarActualizacionPerfil, actualizarGimnasioSeleccionado } = useAuthService();
    const navigation = useNavigation();
    
    // Estados de control
    const [modalVisible, setModalVisible] = useState(false);
    const [ajustesVisible, setAjustesVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false); // Modal para editar perfil
    
    // Estados para cambio de contraseña
    const [newPassword, setNewPassword] = useState('');
    const [oldPassword, setOldPassword] = useState(''); 
    const [loading, setLoading] = useState(false);

    //Selecion de Gimnasios
    const [gymModalVisible, setGymModalVisible] = useState(false);
    const [listaGimnasios, setListaGimnasios] = useState<any[]>([]);
    const [passwordCambio, setPasswordCambio] = useState("");
    const [gymSeleccionadoId, setGymSeleccionadoId] = useState(null);   

    // Estados para edición de perfil (Cargan datos actuales del contexto)
    const [nombre, setNombre] = useState('');
    const [apellidoP, setApellidoP] = useState('');
    const [apellidoM, setApellidoM] = useState('');
    const [correo, setCorreo] = useState('');
    const [telefono, setTelefono] = useState('');

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <IconButton 
                    icon="cog" 
                    iconColor="#555" 
                    size={24} 
                    onPress={() => setAjustesVisible(true)} 
                />
            ),
        }); 
    }, [navigation]);

    useFocusEffect(
    useCallback(() => {
        let isMounted = true;

        const cargarDatosUnaVez = async () => {
            // Usamos los valores actuales del contexto
            const currentId = users?.Id || users?.id;
            const currentToken = users?.Token || users?.token;

            if (isMounted && currentId && currentToken && !loading) {
                console.log("📡 Sincronización por cambio detectado...");
                await sincronizarPerfil(currentId, users.Correo || users.correo || "", currentToken);
            }
        };

        cargarDatosUnaVez();

        return () => {
            isMounted = false;
        };
    }, [users?.id, users?.gymId, users?.token]) // 👈 AGREGA ESTAS DEPENDENCIAS
);

    const handleLogout = async () => {
        setAjustesVisible(false);
        try {
            await cerrarSesionUniversal();
            setUsers(null); 
            router.replace("/");
        } catch (error) {
            setUsers(null);
            router.replace("/");
        }
    };

    // --- FUNCIÓN PARA GUARDAR CAMBIOS DE PERFIL ---
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
                Telefono: telefono
            };

            // Llamada al servicio que coordina API (.NET) + SQLite + Contexto
            const res = await sincronizarActualizacionPerfil(users.id, nuevosDatos);

            if (res.success) {
                Alert.alert("Éxito", res.message);
                setEditModalVisible(false);
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "No se pudo actualizar el perfil.");
        } finally {
            setLoading(false);
        }
    };

    //Cambio Contraseña
    const handleConfirmarCambio = async () => {
    if (!oldPassword || !newPassword) {
        Alert.alert("Campos requeridos", "Por favor llena ambos campos.");
        return;
    }
    setLoading(true);
    try {
        // Llamada a la API con cifrado
        const res = await actualizarPasswordApi(oldPassword, newPassword, users.token);

        if (res) {
            Alert.alert(
                "Seguridad Actualizada", 
                "Tu contraseña ha sido cambiada. Por seguridad, debes iniciar sesión de nuevo.",
                [{ text: "OK", onPress: () => handleLogout() }] // Forzamos el logout
            );
            setModalVisible(false);
            setOldPassword('');
            setNewPassword('');
        }
    } catch (error: any) {
        // Aquí se mostrarán errores como "La contraseña actual es incorrecta" o requisitos de seguridad
        Alert.alert("Error de Seguridad", error.message);
    } finally {
        setLoading(false);
    }
    };

    // --- FUNCIONES DE GIMNASIO ACTUALIZADAS ---
const handleAbrirConfigGym = async () => {
    setLoading(true);
    try {
        // Obtenemos el correo del contexto de usuario
        const correo = users?.correo || users?.Correo;
        
        // Llamamos a la API. Al no pasar password ni ID, el C# entrará al "Caso B" (Lista)
        const res = await gestionarSucursalesApi(correo);
        
        console.log("Respuesta lista gimnasios:", res);

        if (res.Accion === "MostrarLista" && res.Gimnasios) {
            if (res.Gimnasios.length > 0) {
                setListaGimnasios(res.Gimnasios);
                setGymModalVisible(true);
            } else {
                Alert.alert("Aviso", "No se encontraron otras sucursales vinculadas.");
            }
        }
    } catch (error: any) {
        console.error("DEBUG GYM ERROR:", error);
        // Si el error es 401, el mensaje dirá "Sesión expirada" gracias a la validación en api.js
        Alert.alert("Error", error.message || "No se pudo cargar la lista de sucursales.");
    } finally {
        setLoading(false);
    }
};

const handleCambiarGym = async (gymId: number, password: string) => {
    if (!password) {
        Alert.alert("Error", "Debes ingresar la contraseña para cambiar de sucursal.");
        return;
    }

    setLoading(true);
    try {
        const correoUsuario = users?.correo || users?.Correo;
        const userId = users?.id || users?.Id;

        // 1. Llamamos a la función que orquesta el cambio (API -> SQLite -> Contexto)
        // Es vital que 'actualizarGimnasioSeleccionado' reciba estos 4 parámetros
        await actualizarGimnasioSeleccionado(gymId, userId, correoUsuario, password);

        Alert.alert("Éxito", "Cambiando a la sucursal seleccionada...");
        setGymModalVisible(false);
        
        // 2. Redirigir al Home para refrescar todos los datos con el nuevo Token/GymId
        router.replace("/(tabs)/home");
    } catch (error: any) {
        console.error("Error al cambiar gym:", error);
        Alert.alert("Error de Validación", error.message || "Contraseña incorrecta o error de conexión.");
    } finally {
        setLoading(false);
    }
};

    return (
        <ContainerPerfil>
            <Title style={{ marginTop: 20 }}>Perfil Usuario</Title>

            <InfoSection>
                <InfoRow><Label>Nombre</Label><Value>{users?.nombres || "Cargando..."}</Value></InfoRow>
                <InfoRow><Label>Apellido Paterno</Label><Value>{users?.apellidoPaterno || "Cargando..."}</Value></InfoRow>
                <InfoRow><Label>Apellido Materno</Label><Value>{users?.apellidoMaterno || "Cargando..."}</Value></InfoRow>
                <InfoRow><Label>Correo</Label><Value>{users?.correo}</Value></InfoRow>
                <InfoRow><Label>Teléfono</Label><Value>{users?.telefono}</Value></InfoRow>
            </InfoSection>

            {/* --- MODAL DE CONFIGURACIÓN PRINCIPAL --- */}
            <Modal animationType="slide" transparent={true} visible={ajustesVisible} onRequestClose={() => setAjustesVisible(false)}>
                <View style={styles.ajustesContainer}>
                    <View style={styles.ajustesHeader}>
                        <IconButton icon="arrow-left" size={26} onPress={() => setAjustesVisible(false)} />
                        <Text style={styles.ajustesTitle}>Configuración</Text>
                    </View>

                    <View style={styles.optionsList}>
                        <List.Item
                            title="Modificar Información"
                            description="Cambia tus datos personales"
                            left={props => <List.Icon {...props} icon="account-edit-outline" />}
                            onPress={() => {
                                // Cargamos los datos actuales antes de abrir el modal de edición
                                setNombre(users?.nombres || "");
                                setApellidoP(users?.apellidoPaterno || "");
                                setApellidoM(users?.apellidoMaterno || "");
                                setCorreo(users?.correo || "");
                                setTelefono(users?.telefono || "");
                                setEditModalVisible(true);
                            }}
                        />
                        <Divider />
                        <List.Item
                            title="Seguridad"
                            description="Cambiar contraseña"
                            left={props => <List.Icon {...props} icon="lock-outline" />}
                            onPress={() => setModalVisible(true)}
                        />
                        <Divider />
                        <List.Item
                            title="Mi Gimnasio"
                            description="Cambia tu gimnasio de entrenamiento"
                            left={props => <List.Icon {...props} icon="dumbbell" />}
                            // Cambia setGymModalVisible(true) por handleAbrirConfigGym
                            onPress={handleAbrirConfigGym} 
                        />
                        <Divider />
                        <List.Item
                            title="Cerrar Sesión"
                            titleStyle={{ color: 'red', fontWeight: 'bold' }}
                            left={props => <List.Icon {...props} icon="logout" color="red" />}
                            onPress={handleLogout}
                        />
                    </View>
                </View>
            </Modal>

            {/* --- MODAL PARA EDITAR PERFIL --- */}
            <Modal animationType="slide" transparent={true} visible={editModalVisible}>
                <ModalContainer>
                    <ModalContent style={{ width: '90%', maxHeight: '85%' }}>
                        <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%' }}>
                            <Title style={{ fontSize: 20, marginBottom: 15 }}>Editar Perfil</Title>
                            
                            <Label style={{ marginBottom: 5, fontSize: 14 }}>Nombre</Label>
                            <InputModal placeholder="Nombre" value={nombre} onChangeText={setNombre} />
                            
                            <Label style={{ marginBottom: 5, fontSize: 14 }}>Apellido Paterno</Label>
                            <InputModal placeholder="Apellido Paterno" value={apellidoP} onChangeText={setApellidoP} />
                            
                            <Label style={{ marginBottom: 5, fontSize: 14 }}>Apellido Materno</Label>
                            <InputModal placeholder="Apellido Materno" value={apellidoM} onChangeText={setApellidoM} />
                            
                            <Label style={{ marginBottom: 5, fontSize: 14 }}>Teléfono</Label>
                            <InputModal placeholder="Teléfono" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
                            
                            <Label style={{ marginBottom: 5, fontSize: 14 }}>Correo Electrónico</Label>
                            <InputModal placeholder="Correo" value={correo} onChangeText={setCorreo} keyboardType="email-address" autoCapitalize="none" />

                            <View style={{ flexDirection: 'row', marginTop: 20, justifyContent: 'space-around', marginBottom: 10 }}>
                                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                    <Text style={{ color: 'red', fontWeight: 'bold' }}>CANCELAR</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleGuardarPerfil} disabled={loading}>
                                    <Text style={{ color: loading ? '#ccc' : '#9815d0', fontWeight: 'bold' }}>
                                        {loading ? "GUARDANDO..." : "GUARDAR"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </ModalContent>
                </ModalContainer>
            </Modal>

            {/* --- MODAL DE CAMBIO DE CONTRASEÑA --- */}
            <Modal animationType="fade" transparent={true} visible={modalVisible}>
                <ModalContainer>
                    <ModalContent>
                        <Title style={{ fontSize: 20, marginBottom: 15 }}>Nueva Seguridad</Title>
                        <InputModal placeholder="Contraseña Actual" secureTextEntry value={oldPassword} onChangeText={setOldPassword} />
                        <InputModal placeholder="Nueva Contraseña" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
                        <View style={{ flexDirection: 'row', marginTop: 20 }}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginRight: 30 }}>
                                <Text style={{ color: 'red', fontWeight: 'bold' }}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleConfirmarCambio} disabled={loading}>
                                <Text style={{ color: loading ? '#ccc' : '#9815d0', fontWeight: 'bold' }}>
                                    {loading ? "PROCESANDO..." : "CONFIRMAR"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ModalContent>
                </ModalContainer>
            </Modal>

            {/* --- MODAL PARA CAMBIAR GIMNASIO --- */}
             <Modal
                    visible={gymModalVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => {
                        setGymModalVisible(false);
                        setGymSeleccionadoId(null);
                        setPasswordCambio("");
                    }}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Selecciona una Sucursal</Text>

                            <ScrollView style={{ width: '100%', maxHeight: 300 }}>
                                {listaGimnasios && listaGimnasios.length > 0 ? (
                                    listaGimnasios.map((gym) => (
                                        <TouchableOpacity
                                            key={gym.Id} // Usamos Id (Mayúscula) como viene del C#
                                            style={[
                                                styles.gymItem, 
                                                gymSeleccionadoId === gym.Id && { borderColor: '#9815d0', borderWidth: 2, backgroundColor: '#f3e5f5' }
                                            ]}
                                            onPress={() => setGymSeleccionadoId(gym.Id)}
                                        >
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Text style={[
                                                    styles.gymText,
                                                    gymSeleccionadoId === gym.Id && { fontWeight: 'bold', color: '#9815d0' }
                                                ]}>
                                                    {gym.Nombre}
                                                </Text>
                                                
                                                {/* Marcamos el gimnasio en el que el usuario está actualmente logueado */}
                                                {(users?.gymId === gym.Id || users?.SuperUsuarioId === gym.Id) && (
                                                    <List.Icon icon="check-circle" color="#9815d0" />
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <Text style={{ textAlign: 'center', marginVertical: 20, color: '#666' }}>
                                        No se encontraron sucursales vinculadas.
                                    </Text>
                                )}
                            </ScrollView>

                            {/* --- SECCIÓN DE CONTRASEÑA --- */}
                            {/* Solo se muestra si hay un gym seleccionado y no es el actual */}
                            {gymSeleccionadoId && gymSeleccionadoId !== (users?.gymId || users?.SuperUsuarioId) && (
                                <View style={{ width: '100%', marginTop: 15, paddingHorizontal: 5 }}>
                                    <Divider style={{ marginBottom: 15 }} />
                                    <Text style={{ fontSize: 12, color: '#666', marginBottom: 5 }}>
                                        Ingresa la contraseña para esta sucursal:
                                    </Text>
                                    <TextInput
                                        label="Contraseña"
                                        value={passwordCambio}
                                        onChangeText={setPasswordCambio}
                                        secureTextEntry
                                        autoFocus={true} // Para que el teclado abra rápido
                                        mode="outlined"
                                        outlineColor="#9815d0"
                                        activeOutlineColor="#9815d0"
                                        style={{ marginBottom: 10, backgroundColor: '#fff' }}
                                    />
                                    <Button 
                                        mode="contained" 
                                        onPress={() => handleCambiarGym(gymSeleccionadoId, passwordCambio)}
                                        loading={loading}
                                        disabled={!passwordCambio || loading}
                                        buttonColor="#9815d0"
                                        style={{ borderRadius: 8 }}
                                    >
                                        Confirmar y Entrar
                                    </Button>
                                </View>
                            )}

                            <Button 
                                mode="text" 
                                onPress={() => {
                                    setGymModalVisible(false);
                                    setGymSeleccionadoId(null);
                                    setPasswordCambio("");
                                }} 
                                textColor="#666"
                                style={{ marginTop: 10 }}
                            >
                                Cancelar
                            </Button>
                        </View>
                    </View>
                </Modal>
           
        </ContainerPerfil>
    );
}

const styles = StyleSheet.create({
    ajustesContainer: { 
        flex: 1, 
        backgroundColor: '#FFFFFF', 
    },
    ajustesHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingTop: 50, 
        paddingBottom: 15,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#ECECEC',
    },
    ajustesTitle: { fontSize: 22, fontWeight: '600', marginLeft: 5 },
    optionsList: { marginTop: 10 },
    gymItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    },
    gymText: {
        fontSize: 16,
        color: '#333',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', // Fondo semi-transparente
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: { // 👈 Agrega este para quitar el error de image_59314d.png
        marginTop: 20,
        backgroundColor: '#9815d0',
        width: '100%',
    },
});