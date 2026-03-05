import { Text, View, Alert, Modal, TouchableOpacity } from "react-native";
import React, { useContext, useCallback, useState } from 'react';
import { 
    ContainerPerfil, Title, BotonSalida, InfoSection, 
    InfoRow, Label, Value, TextSalir,
    ModalContainer, ModalContent, InputModal // Asegúrate de exportar estos en tus estilos
} from "@/styles/perfilStyle";
import { UserContext } from "@/components/UserContext";
import { useAuthService } from "@/servicesdb/authService";
import { useFocusEffect } from 'expo-router';
import { cerrarSesionUniversal } from '../../services/authgoogle'; 
import { router } from "expo-router";

export default function Perfil() {
    // 1. Estados y Contexto
    const { users, setUsers } = useContext(UserContext);
    const { sincronizarPerfil, obtenerUsuarioLocal, actualizarPassword } = useAuthService();
    
    const [modalVisible, setModalVisible] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [oldPassword, setOldPassword] = useState(''); // Estado para la pass actual
    const [loading, setLoading] = useState(false);
    
    

    // 2. Carga de datos al enfocar la pantalla
    useFocusEffect(
        useCallback(() => {
            const cargarDatosCadaVez = async () => {
                console.log("Nomada: Entrando a Perfil...");
                if (users?.id && users?.token) {
                    await sincronizarPerfil(
                        users.id.toString(), 
                        users.correo || "", 
                        users.token || ""
                    );
                } else {
                    const local = await obtenerUsuarioLocal();
                    if (local && local.length > 0) {
                        await sincronizarPerfil(
                            local[0].id || 0, 
                            local[0].correo || "", 
                            local[0].token || ""
                        );
                    }
                }
            };
            cargarDatosCadaVez();
        }, [users?.id, users?.token])
    );

    // 3. Lógica de Logout
    const handleLogout = async () => {
        try {
            await cerrarSesionUniversal();
            setUsers(null); 
            router.replace("/");
            console.log("Flujo de cierre completado con éxito");
        } catch (error) {
            Alert.alert("Aviso", "Hubo un detalle al contactar al servidor, pero tu sesión local se cerrará.");
            setUsers(null);
            router.replace("/");
        }
    };

    const handleConfirmarCambio = async () => {
        // 1. Validaciones de campos vacíos
        if (!oldPassword || !newPassword) {
            Alert.alert("Campos requeridos", "Por favor llena ambos campos.");
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert("Seguridad", "La nueva contraseña debe tener al menos 6 caracteres.");
            return;
        }

        setLoading(true);
        try {
            // 2. VERIFICACIÓN: Consultamos la contraseña actual en SQLite
            // Asumo que tu servicio 'obtenerUsuarioLocal' trae el campo 'password'
            const local = await obtenerUsuarioLocal();
            const passwordEnBD = local[0].contrasena; 

            if (oldPassword !== passwordEnBD) {
                Alert.alert("Error", "La contraseña actual no es correcta.");
                setLoading(false);
                return;
            }

            // 3. Si coincide, procedemos al UPDATE
            await actualizarPassword(newPassword, users.id); 

            Alert.alert("Éxito", "Contraseña actualizada correctamente.");
            setModalVisible(false);
            setOldPassword('');
            setNewPassword('');
        } catch (error) {
            Alert.alert("Error", "Ocurrió un error al validar la base de datos.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ContainerPerfil>
            <Title>Perfil Usuario</Title>

            <InfoSection>
                <InfoRow>
                    <Label>Nombre</Label>
                    <Value>{users?.nombres || "Cargando..."}</Value>
                </InfoRow>
                <InfoRow>
                    <Label>Apellido Paterno</Label>
                    <Value>{users?.apellidoPaterno || "Cargando..."}</Value>
                </InfoRow>
                <InfoRow>
                    <Label>Apellido Materno</Label>
                    <Value>{users?.apellidoMaterno || "Cargando..."}</Value>
                </InfoRow>
                <InfoRow>
                    <Label>Correo</Label>
                    <Value>{users?.correo}</Value>
                </InfoRow>
                <InfoRow>
                    <Label>Teléfono</Label>
                    <Value>{users?.telefono}</Value>
                </InfoRow>
            </InfoSection>

            {/* BOTÓN PARA ABRIR MODAL */}
            <TouchableOpacity 
                onPress={() => setModalVisible(true)}
                style={{
                    backgroundColor: '#4af500',
                    padding: 10,
                    marginHorizontal: 20,
                    borderRadius: 8,
                    alignItems: 'center',
                    marginTop: 20
                }}
            >
                <Text style={{ fontWeight: 'bold', color: '#000' }}>MODIFICAR CONTRASEÑA</Text>
            </TouchableOpacity>

            {/* BOTÓN DE SALIDA */}
            <BotonSalida onPress={handleLogout}>
                <TextSalir> Salida </TextSalir>
            </BotonSalida>

            {/* MODAL DE CAMBIO DE CONTRASEÑA */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
            >
                <ModalContainer>
                    <ModalContent>
                        <Title style={{ fontSize: 22, color: '#333', marginBottom: 10 }}>
                            Cambiar Seguridad
                        </Title>
                        
                        {/* INPUT CONTRASEÑA ANTIGUA */}
                        <InputModal
                            placeholder="Contraseña Actual"
                            secureTextEntry={true}
                            value={oldPassword}
                            onChangeText={setOldPassword}
                            editable={!loading}
                        />

                        {/* INPUT CONTRASEÑA NUEVA */}
                        <InputModal
                            placeholder="Nueva Contraseña"
                            secureTextEntry={true}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            editable={!loading}
                        />

                        <View style={{ flexDirection: 'row', marginTop: 20 }}>
                            <TouchableOpacity 
                                onPress={() => { 
                                    setModalVisible(false); 
                                    setOldPassword('');
                                    setNewPassword(''); 
                                }}
                                style={{ marginRight: 30 }}
                                disabled={loading}
                            >
                                <Text style={{ color: 'red', fontWeight: 'bold' }}>CANCELAR</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                onPress={handleConfirmarCambio}
                                disabled={loading}
                            >
                                <Text style={{ 
                                    color: loading ? '#ccc' : '#9815d0', 
                                    fontWeight: 'bold' 
                                }}>
                                    {loading ? "VALIDANDO..." : "CONFIRMAR"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ModalContent>
                </ModalContainer>
            </Modal>

        </ContainerPerfil>
    );
}