import { router, useLocalSearchParams } from "expo-router";
import React, { useContext, useState } from "react";
import { UserContext } from "../components/UserContext";
import { useAuthService } from "@/servicesdb/authService";
import * as Application from 'expo-application';
import { 
  Alert, Platform, ScrollView, KeyboardAvoidingView, 
  TouchableOpacity, View, Text, Image, Modal, StyleSheet, 
  Dimensions, TextInput, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from '@react-native-community/datetimepicker';
import MaskInput from 'react-native-mask-input';
import CountryPicker, { CountryCode, Country } from 'react-native-country-picker-modal';
import BtnLoginGoogle from "../components/BtnLoginGoogle";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function Registro() {
  const { setUsers } = useContext(UserContext);
  const params = useLocalSearchParams();
  const { registrarUsuarioProceso } = useAuthService();

  // --- ESTADOS ---
  const [nombre, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [apellidoPaterno, setLastNameP] = useState("");
  const [apellidoMaterno, setLastNameM] = useState("");
  const [telefono, setNumberPhone] = useState("");
  const [secure, setSecure] = useState(true);
  const [esEstudiante, setEsEstudiante] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // --- CELULAR ---
  const [countryCode, setCountryCode] = useState<CountryCode>('MX');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [callingCode, setCallingCode] = useState('52');
  const [telefonoLimpio, setTelefonoLimpio] = useState('');
  const phoneMask = ['(', /\d/, /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/];

  // --- FECHA ---
  const [date, setDate] = useState(new Date(2000, 0, 1)); 
  const [show, setShow] = useState(false);
  const [fechaTexto, setFechaTexto] = useState("Selecciona tu fecha");

  // --- GYM DATA ---
  const [gymSelected] = useState<number | null>(Number(params.gymId) || null);
  const [nombreGimnasio] = useState(params.gymNombre || "");

  const onSelect = (country: Country) => {
    setCountryCode(country.cca2);
    setCallingCode(country.callingCode[0]);
  };

  const validarEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handlRegister = async () => {
    if (!nombre || !email || !password || !apellidoPaterno || !apellidoMaterno || !telefonoLimpio) {
      Alert.alert("Atención", "Todos los campos son obligatorios");
      return;
    }

    const complejidadRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (password.includes(" ") || !complejidadRegex.test(password)) {
      Alert.alert("Seguridad", "La contraseña debe tener 8 caracteres, una mayúscula, una minúscula y un número.");
      return;
    }

    if (esEstudiante === 0) {
      Alert.alert("Atención", "Selecciona si eres estudiante");
      return;
    }

    if (!validarEmail(email)) {
        Alert.alert("Atención", "El correo electrónico no es válido");
        return;
    }

    try {
      setLoading(true);
      let deviceId = Platform.OS === 'android' ? await Application.getAndroidId() : await Application.getIosIdForVendorAsync();
      const fechaFinal = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;

      const NewUser = { 
        nombre, 
        apellidoPaterno, 
        apellidoMaterno,
        email,
        password, 
        telefono: `+${callingCode}${telefonoLimpio}`,
        deviceId,
        estudiante: esEstudiante === 1,
        fechaNacimiento: fechaFinal,
        gymId: gymSelected
      };

      await registrarUsuarioProceso(NewUser);
      setUsers(NewUser);
      Alert.alert("Éxito", "Registro completado correctamente");
      router.replace("/"); 
    } catch (error) {
      console.error("Error en registro:", error);
      Alert.alert("Error", "No se pudo completar el registro.");
    } finally {
      setLoading(false);
    }
  };

  const onData = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setShow(false);
      return;
    }
    const currentDate = selectedDate || date;
    setShow(false);
    setDate(currentDate);
    let f = currentDate.getDate().toString().padStart(2, '0') + '/' + 
            (currentDate.getMonth() + 1).toString().padStart(2, '0') + '/' + 
            currentDate.getFullYear();
    setFechaTexto(f);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.mainContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        <View style={styles.neonPanel}>
          <Text style={styles.neonTitle}>Registrarse</Text>
          
          <View style={styles.googleSection}>
            <Text style={styles.subText}>También puedes registrarte con:</Text>
            <BtnLoginGoogle folioExterno={gymSelected} />
            <View style={styles.gymBadge}>
              <Text style={styles.gymBadgeText}>Gimnasio: {nombreGimnasio}</Text>
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Nombre(s)</Text>
            <TextInput style={styles.neonInput} onChangeText={setUser} placeholder="Tu nombre" placeholderTextColor="#444" />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputWrapper, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>A. Paterno</Text>
              <TextInput style={styles.neonInput} onChangeText={setLastNameP} placeholder="Paterno" placeholderTextColor="#444" />
            </View>
            <View style={[styles.inputWrapper, { flex: 1 }]}>
              <Text style={styles.label}>A. Materno</Text>
              <TextInput style={styles.neonInput} onChangeText={setLastNameM} placeholder="Materno" placeholderTextColor="#444" />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Correo Electrónico</Text>
            <TextInput style={styles.neonInput} keyboardType="email-address" autoCapitalize="none" onChangeText={setEmail} placeholder="ejemplo@correo.com" placeholderTextColor="#444" />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.passwordContainer}>
              <TextInput secureTextEntry={secure} style={styles.passwordInput} onChangeText={setPassword} placeholder="********" placeholderTextColor="#444" />
              <TouchableOpacity onPress={() => setSecure(!secure)}>
                <Text style={styles.showHideText}>{secure ? "MOSTRAR" : "OCULTAR"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Número de Teléfono</Text>
            <View style={styles.phoneContainer}>
              <TouchableOpacity onPress={() => setShowCountryPicker(true)} style={styles.countryBtn}>
                <Image source={{ uri: `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png` }} style={styles.flag} />
                <Text style={styles.callingCode}>+{callingCode}</Text>
              </TouchableOpacity>
              <MaskInput
                value={telefono}
                onChangeText={(masked, unmasked) => { setNumberPhone(masked); setTelefonoLimpio(unmasked); }}
                mask={phoneMask}
                keyboardType="numeric"
                style={styles.phoneInput}
                placeholder="(644) 000-0000"
                placeholderTextColor="#444"
              />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Fecha de Nacimiento</Text>
            <TouchableOpacity onPress={() => setShow(true)} style={styles.dateBtn}>
              <Text style={[styles.dateText, fechaTexto === "Selecciona tu fecha" && { color: '#444' }]}>{fechaTexto}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>¿Eres estudiante?</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={esEstudiante} onValueChange={(v) => setEsEstudiante(v)} style={{ color: '#fff' }} dropdownIconColor="#00E5FF">
                <Picker.Item label="Selecciona una opción..." value={0} color="#444" />
                <Picker.Item label="Sí, soy estudiante" value={1} />
                <Picker.Item label="No soy estudiante" value={2} />
              </Picker>
            </View>
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handlRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#00E5FF" /> : <Text style={styles.submitBtnText}>REGISTRARSE</Text>}
          </TouchableOpacity>

          {/* --- BOTÓN PARA REGRESAR AL LOGIN --- */}
          <TouchableOpacity 
            style={styles.backToLoginBtn} 
            onPress={() => router.back()}
          >
            <Text style={styles.backToLoginText}>
              ¿Ya tienes cuenta? <Text style={styles.backToLoginHighlight}>Inicia Sesión</Text>
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>

      <Modal visible={showCountryPicker} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCountryPicker(false)} style={styles.closeModalBtn}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Selecciona tu país</Text>
          </View>
          <CountryPicker
            countryCode={countryCode}
            visible={showCountryPicker}
            onSelect={(c) => { onSelect(c); setShowCountryPicker(false); }}
            withFilter
            withAlphaFilter
            theme={{ backgroundColor: '#000', onBackgroundTextColor: '#fff', fontSize: 16 }}
          />
        </SafeAreaView>
      </Modal>

      {show && (
        <DateTimePicker value={date} mode="date" display="spinner" maximumDate={new Date()} onChange={onData} />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#000' },
  scrollContainer: { flexGrow: 1, paddingVertical: 40, alignItems: 'center' },
  neonPanel: {
    width: SCREEN_WIDTH * 0.9,
    backgroundColor: '#0A0A0A',
    borderRadius: 25,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
  },
  neonTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00E5FF',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 229, 255, 0.5)',
    textShadowRadius: 10,
  },
  googleSection: { alignItems: 'center', marginBottom: 25 },
  subText: { color: '#666', marginBottom: 10, fontSize: 13 },
  gymBadge: { marginTop: 15, paddingVertical: 4, paddingHorizontal: 12, borderRadius: 15, backgroundColor: 'rgba(0, 229, 255, 0.1)', borderWidth: 1, borderColor: '#00E5FF' },
  gymBadgeText: { color: '#00E5FF', fontSize: 12, fontWeight: 'bold' },
  inputWrapper: { width: '100%', marginBottom: 18 },
  row: { flexDirection: 'row', width: '100%' },
  label: { color: '#00E5FF', fontSize: 12, marginBottom: 6, marginLeft: 4, fontWeight: '600' },
  neonInput: { height: 50, backgroundColor: '#000', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.3)', color: '#fff', paddingHorizontal: 15 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.3)' },
  passwordInput: { flex: 1, height: 50, color: '#fff', paddingHorizontal: 15 },
  showHideText: { color: '#00E5FF', fontSize: 10, fontWeight: 'bold', paddingRight: 15 },
  phoneContainer: { flexDirection: 'row', height: 50, backgroundColor: '#000', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.3)', overflow: 'hidden' },
  countryBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, backgroundColor: '#111', borderRightWidth: 1, borderRightColor: 'rgba(0, 229, 255, 0.1)' },
  flag: { width: 25, height: 18, marginRight: 8, borderRadius: 2 },
  callingCode: { color: '#00E5FF', fontWeight: 'bold' },
  phoneInput: { flex: 1, color: '#fff', paddingHorizontal: 15 },
  dateBtn: { height: 50, backgroundColor: '#000', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.3)', justifyContent: 'center', paddingHorizontal: 15 },
  dateText: { color: '#fff' },
  pickerContainer: { backgroundColor: '#000', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.3)', overflow: 'hidden' },
  submitBtn: { width: '100%', height: 55, backgroundColor: '#000', borderRadius: 15, borderWidth: 2, borderColor: '#00E5FF', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#00E5FF', fontSize: 16, fontWeight: 'bold', letterSpacing: 2 },
  backToLoginBtn: { marginTop: 25, paddingVertical: 10, alignItems: 'center', width: '100%' },
  backToLoginText: { color: '#666', fontSize: 14, fontWeight: '500' },
  backToLoginHighlight: { color: '#00E5FF', fontWeight: 'bold', textDecorationLine: 'underline' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
  closeModalBtn: { width: 35, height: 35, borderRadius: 10, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 15 }
});


