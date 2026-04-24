import { UserContext } from "@/components/UserContext";
import { actualizarPasswordApi, gestionarSucursalesApi } from "@/services/api";
import { useAuthService } from "@/servicesdb/authService";
import { router } from "expo-router";
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Alert, Image, Modal, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import CountryPicker, { FlagType, getAllCountries } from 'react-native-country-picker-modal';
import MaskInput from 'react-native-mask-input';
import { Button, Dialog, Divider, IconButton, List, Portal, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

const COLORS = {
    bg: '#000000',
    cardBg: '#222121',
    accent: '#39FF14', 
    brandPink: '#FF3CAC', 
    pinkFade: 'rgba(255, 60, 172, 0.3)',
    textMain: '#FFFFFF',
    textSub: '#A0A0A0',
    divider: '#2C2C2C',
    inputBg: '#1E1E1E'
};

const CuentaScreen = () => {
    const { users, setUsers } = useContext(UserContext);
    const { sincronizarActualizacionPerfil, actualizarGimnasioSeleccionado, actualizarPassword } = useAuthService();
    console.log("datos perfil", users);

    const [nombre, setNombre] = useState('');
    const [apellidoP, setApellidoP] = useState('');
    const [apellidoM, setApellidoM] = useState('');
    const [correo, setCorreo] = useState('');
    
    // --- LÓGICA DE FECHA ---
    const [date, setDate] = useState(new Date(2000, 0, 1));
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [fechaTexto, setFechaTexto] = useState("Selecciona tu fecha");

    const [telefono, setTelefono] = useState('');
    const [telefonoLimpio, setTelefonoLimpio] = useState('');
    const [countryCode, setCountryCode] = useState<any>(''); 
    const [callingCode, setCallingCode] = useState('');
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const phoneMask = ['(', /\d/, /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/];

    const [expanded, setExpanded] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [modalVisible, setModalVisible] = useState(false);

    const [gymModalVisible, setGymModalVisible] = useState(false);
    const [listaGimnasios, setListaGimnasios] = useState<any[]>([]);
    const [passwordCambio, setPasswordCambio] = useState("");
    const [gymSeleccionadoId, setGymSeleccionadoId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    // Memorizar cambios para habilitar/deshabilitar botón
    const hayCambios = useMemo(() => {
        if (!users) return false;
        const telDb = users.telefono || users.Telefono || "";
        const soloNumerosDb = telDb.replace(/\D/g, '');
        const diezDigitosDb = soloNumerosDb.slice(-10);
        const ladaDb = soloNumerosDb.slice(0, soloNumerosDb.length - 10) || "52";
        const fechaDb = users.fechaNacimiento || users.FechaNacimiento || "";

        return (
            nombre !== (users.nombres || users.Nombre || "") ||
            apellidoP !== (users.apellidoPaterno || users.ApellidoPaterno || "") ||
            apellidoM !== (users.apellidoMaterno || users.ApellidoMaterno || "") ||
            telefonoLimpio !== diezDigitosDb ||
            callingCode !== ladaDb ||
            fechaTexto !== fechaDb
        );
    }, [nombre, apellidoP, apellidoM, telefonoLimpio, callingCode, fechaTexto, users]);

    useEffect(() => {
        if (users) {
            setNombre(users.nombres || users.Nombre || "");
            setApellidoP(users.apellidoPaterno || users.ApellidoPaterno || "");
            setApellidoM(users.apellidoMaterno || users.ApellidoMaterno || "");
            setCorreo(users.correo || users.Correo || "");
            
            const telDb = users.telefono || users.Telefono || "";
            const soloNumeros = telDb.replace(/\D/g, '');
            const diezDigitos = soloNumeros.slice(-10);
            const ladaDb = soloNumeros.slice(0, soloNumeros.length - 10) || "52";
            
            setTelefonoLimpio(diezDigitos);
            setTelefono(diezDigitos); 
            setCallingCode(ladaDb);

            // CARGAR FECHA INICIAL MEJORADO
            const fNac = users.fechaNacimiento || users.FechaNacimiento || "";
            if (fNac) {
                setFechaTexto(fNac);
                try {
                    if (fNac.includes('/')) {
                        const [d, m, y] = fNac.split('/');
                        setDate(new Date(parseInt(y), parseInt(m) - 1, parseInt(d)));
                    } else if (fNac.includes('-')) {
                        const [y, m, d] = fNac.split('-');
                        setDate(new Date(parseInt(y), parseInt(m) - 1, parseInt(d)));
                    }
                } catch (e) { console.log("Error parse fecha:", e); }
            }

            const inicializarBandera = async () => {
                try {
                    const countries = await getAllCountries(FlagType.FLAT);
                    const countryMatch = countries.find(c => c.callingCode.some(code => code === ladaDb));
                    setCountryCode(countryMatch ? countryMatch.cca2 : 'MX');
                } catch (e) {
                    setCountryCode('MX');
                }
            };
            inicializarBandera();

            const cargarSucursales = async () => {
                try {
                    const res = await gestionarSucursalesApi(users.correo || users.Correo);
                    if (res && res.Gimnasios) setListaGimnasios(res.Gimnasios);
                } catch (e) { console.error("Error sucursales:", e); }
            };
            cargarSucursales();
        }
    }, [users]);

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (event.type === 'set' && selectedDate) {
            const currentDate = selectedDate;
            setDate(currentDate);
            let f = currentDate.getDate().toString().padStart(2, '0') + '/' + 
                    (currentDate.getMonth() + 1).toString().padStart(2, '0') + '/' + 
                    currentDate.getFullYear();
            setFechaTexto(f);
        }
    };

    const nombreGymActual = useMemo(() => {
        const idActual = users?.GimnasioActual || users?.gymId || users?.IdGym;
        if (!idActual || listaGimnasios.length === 0) return "No seleccionada";
        const gym = listaGimnasios.find(g => Number(g.Id || g.id) === Number(idActual));
        return gym ? gym.Nombre : "Cargando...";
    }, [users, listaGimnasios]);

    const handleGuardarPerfil = async () => {
        if (!nombre || !correo) {
            Alert.alert("Campos requeridos", "Nombre y Correo son obligatorios.");
            return;
        }
        if (telefonoLimpio.length !== 10) {
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
                Telefono: `+${callingCode}${telefonoLimpio}`,
                fechaNacimiento: fechaTexto // Minúscula para consistencia
            };
            const res = await sincronizarActualizacionPerfil(users.id || users.Id, nuevosDatos);
            if (res.success) {
                // Actualizar contexto local para que useEffect no resetee nada
                setUsers((prev: any) => ({ 
                    ...prev, 
                    ...nuevosDatos, 
                    nombres: nombre,
                    fechaNacimiento: fechaTexto 
                }));
                Alert.alert("Éxito", "Perfil actualizado.");
                setExpanded(false);
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "No se pudo actualizar.");
        } finally { setLoading(false); }
    };

    const handleConfirmarCambioPass = async () => {
        if (oldPassword === newPassword) {
            Alert.alert("Atención", "La nueva contraseña debe ser diferente a la actual.");
            return;
        }
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
                    left={props => <List.Icon {...props} icon="account-cog" color={COLORS.brandPink} />}
                    expanded={expanded}
                    onPress={() => setExpanded(!expanded)}
                    style={styles.accordion}
                    titleStyle={{ color: COLORS.textMain }}
                >
                    <View style={styles.formContainer}>
                        <TextInput label="Nombre" value={nombre} onChangeText={setNombre} mode="outlined" style={styles.input} outlineColor={COLORS.divider} activeOutlineColor={COLORS.brandPink} textColor={COLORS.textMain} />
                        <TextInput label="Apellido Paterno" value={apellidoP} onChangeText={setApellidoP} mode="outlined" style={styles.input} outlineColor={COLORS.divider} activeOutlineColor={COLORS.brandPink} textColor={COLORS.textMain} />
                        <TextInput label="Apellido Materno" value={apellidoM} onChangeText={setApellidoM} mode="outlined" style={styles.input} outlineColor={COLORS.divider} activeOutlineColor={COLORS.brandPink} textColor={COLORS.textMain} />
                        
                        <Text style={styles.phoneLabel}>Fecha de Nacimiento</Text>
                        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateBtn}>
                            <Text style={{ color: '#fff' }}>{fechaTexto}</Text>
                        </TouchableOpacity>

                        <Text style={styles.phoneLabel}>Número de Teléfono</Text>
                        <View style={styles.phoneContainer}>
                            <TouchableOpacity onPress={() => setShowCountryPicker(true)} style={styles.countryBtn}>
                                {countryCode ? (
                                    <Image source={{ uri: `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png` }} style={styles.flag} />
                                ) : (
                                    <View style={[styles.flag, { backgroundColor: '#333' }]} />
                                )}
                                <Text style={styles.callingCode}>+{callingCode || '...'}</Text>
                            </TouchableOpacity>
                            <MaskInput
                                value={telefono}
                                onChangeText={(masked, unmasked) => {
                                    setTelefono(masked);
                                    setTelefonoLimpio(unmasked);
                                }}
                                mask={phoneMask}
                                keyboardType="numeric"
                                style={styles.phoneInput}
                                placeholder="(644) 000-0000"
                                placeholderTextColor="#444"
                            />
                        </View>

                        <Button 
                            mode="contained" 
                            onPress={handleGuardarPerfil} 
                            loading={loading} 
                            disabled={!hayCambios || loading}
                            buttonColor={COLORS.brandPink} 
                            textColor="#000" 
                            style={[styles.mainBtn, (!hayCambios && !loading) && { opacity: 0.6 }]}
                        >
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

            {showDatePicker && (
                <DateTimePicker 
                    value={date} 
                    mode="date" 
                    display="spinner" 
                    maximumDate={new Date()} 
                    onChange={onDateChange} 
                />
            )}

            <Portal>
                <Dialog visible={modalVisible} onDismiss={() => setModalVisible(false)} style={{ backgroundColor: COLORS.cardBg }}>
                    <Dialog.Title style={{ color: COLORS.textMain }}>Actualizar Contraseña</Dialog.Title>
                    <Dialog.Content>
                        <TextInput label="Contraseña Actual" value={oldPassword} onChangeText={setOldPassword} secureTextEntry mode="outlined" style={styles.input} activeOutlineColor={COLORS.brandPink} outlineColor={COLORS.divider} textColor={COLORS.textMain} />
                        <TextInput label="Nueva Contraseña" value={newPassword} onChangeText={setNewPassword} secureTextEntry mode="outlined" style={styles.input} activeOutlineColor={COLORS.brandPink} outlineColor={COLORS.divider} textColor={COLORS.textMain} />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setModalVisible(false)} textColor={COLORS.textSub}>Cancelar</Button>
                        <Button onPress={handleConfirmarCambioPass} loading={loading} textColor={COLORS.brandPink}>Confirmar</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

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
                                                <TextInput label="Contraseña" value={passwordCambio} onChangeText={setPasswordCambio} secureTextEntry mode="outlined" activeOutlineColor={COLORS.accent} style={styles.input} />
                                                <Button mode="contained" onPress={() => handleCambiarGym(idGym, passwordCambio)} loading={loading} buttonColor={COLORS.accent} textColor="#000">Confirmar</Button>
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

            <Modal visible={showCountryPicker} animationType="slide" transparent={false}>
                <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
                    <View style={styles.modalHeaderCustom}>
                        <Text style={styles.modalHeaderTitle}>Selecciona tu país</Text>
                    </View>
                    <CountryPicker
                        countryCode={countryCode || 'MX'}
                        visible={showCountryPicker}
                        onSelect={(c) => { 
                            setCountryCode(c.cca2); 
                            setCallingCode(c.callingCode[0]); 
                            setShowCountryPicker(false); 
                        }}
                        onClose={() => setShowCountryPicker(false)}
                        withFilter withFlag withEmoji withAlphaFilter withCallingCode
                        withModal={false} 
                        theme={{ 
                            backgroundColor: COLORS.bg, 
                            onBackgroundTextColor: COLORS.textMain, 
                            fontSize: 16,
                            filterPlaceholderTextColor: COLORS.textSub,
                        }}
                    />
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
    sectionCard: { backgroundColor: COLORS.cardBg, marginHorizontal: 15, borderRadius: 15, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.divider, marginBottom: 20 },
    accordion: { backgroundColor: COLORS.cardBg },
    formContainer: { padding: 20, backgroundColor: COLORS.cardBg },
    input: { marginBottom: 10, backgroundColor: COLORS.inputBg },
    mainBtn: { marginTop: 20, borderRadius: 8 },
    phoneLabel: { color: COLORS.brandPink, fontSize: 12, marginBottom: 6, marginLeft: 4, fontWeight: '600' },
    dateBtn: { height: 50, backgroundColor: '#000', borderRadius: 12, borderWidth: 1, borderColor: COLORS.pinkFade, justifyContent: 'center', paddingHorizontal: 15, marginBottom: 10 },
    phoneContainer: { flexDirection: 'row', height: 50, backgroundColor: '#000', borderRadius: 12, borderWidth: 1, borderColor: COLORS.pinkFade, overflow: 'hidden', marginBottom: 10 },
    countryBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, backgroundColor: '#111', borderRightWidth: 1, borderRightColor: COLORS.pinkFade },
    flag: { width: 25, height: 18, marginRight: 8, borderRadius: 2 },
    callingCode: { color: COLORS.brandPink, fontWeight: 'bold' },
    phoneInput: { flex: 1, color: '#fff', paddingHorizontal: 15 },
    divider: { backgroundColor: COLORS.divider, height: 1 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 20, maxHeight: '80%', borderWidth: 1, borderColor: COLORS.divider },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 20, textAlign: 'center' },
    gymItem: { padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.divider, borderRadius: 8, borderWidth: 1, borderColor: 'transparent' },
    passConfirmBox: { padding: 15, backgroundColor: '#111', borderRadius: 12, marginVertical: 10, borderWidth: 1, borderColor: '#333' },
    modalHeaderCustom: { padding: 15, borderBottomWidth: 1, borderBottomColor: COLORS.divider, backgroundColor: COLORS.bg, alignItems: 'center' },
    modalHeaderTitle: { color: COLORS.textMain, fontSize: 18, fontWeight: 'bold' }
});

export default CuentaScreen;    