import { useAuthService } from "@/servicesdb/authService";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from "@react-native-picker/picker";
import * as Application from 'expo-application';
import { router, useLocalSearchParams } from "expo-router";
import React, { useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform, ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity, View
} from 'react-native';
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal';
import MaskInput from 'react-native-mask-input';
import { SafeAreaView } from 'react-native-safe-area-context';
import BtnLoginGoogle from "../components/BtnLoginGoogle";
import { UserContext } from "../components/UserContext";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BRAND_PINK = '#FF3CAC'; 
const BRAND_GREEN = '#39FF14'; 
const PINK_FADE = 'rgba(255, 60, 172, 0.3)';
const GREEN_FADE = 'rgba(57, 255, 20, 0.1)';

export default function Registro() {
  const { setUsers } = useContext(UserContext);
  const params = useLocalSearchParams();
  const { registrarUsuarioProceso } = useAuthService();

  const [nombre, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [apellidoPaterno, setLastNameP] = useState("");
  const [apellidoMaterno, setLastNameM] = useState("");
  const [telefono, setNumberPhone] = useState("");
  const [secure, setSecure] = useState(true);
  const [esEstudiante, setEsEstudiante] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const [countryCode, setCountryCode] = useState<CountryCode>('MX');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [callingCode, setCallingCode] = useState('52');
  const [telefonoLimpio, setTelefonoLimpio] = useState('');
  const phoneMask = ['(', /\d/, /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/];

  const [date, setDate] = useState(new Date(2000, 0, 1)); 
  const [show, setShow] = useState(false);
  const [fechaTexto, setFechaTexto] = useState("Selecciona tu fecha");

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

      // 1. Solo registramos en la base de datos (API y Local)
      await registrarUsuarioProceso(NewUser);
      
      // 2. NO HACER setUsers(NewUser); 
      // Al no setearlo, el contexto sigue vacío y la app no te loguea solo.
      //setUsers(NewUser);

      // Nota: El alert de "Éxito" muévelo preferiblemente dentro del servicio 
      // o asegúrate de que registrarUsuarioProceso lance un error si la API falla.

      // 3. Mandar al Login (que es la raíz "/")
      router.replace("/");
    } catch (error) {
      // Este catch ahora sí atrapará los errores reales
      console.error("Error en pantalla registro:", error);
      // No necesitas poner un Alert aquí si tu servicio (authService) ya muestra uno.
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
              <Picker selectedValue={esEstudiante} onValueChange={(v) => setEsEstudiante(v)} style={{ color: '#fff' }} dropdownIconColor={BRAND_PINK}>
                <Picker.Item label="Selecciona una opción..." value={0} color="#444" />
                <Picker.Item label="Sí, soy estudiante" value={1} color={Platform.OS === 'ios' ? '#fff' : '#000'} />
                <Picker.Item label="No soy estudiante" value={2} color={Platform.OS === 'ios' ? '#fff' : '#000'} />
              </Picker>
            </View>
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handlRegister} disabled={loading}>
            {loading ? <ActivityIndicator color={BRAND_PINK} /> : <Text style={styles.submitBtnText}>REGISTRARSE</Text>}
          </TouchableOpacity>

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

      {/* MODAL CORREGIDO CON BANDERAS PARA REGISTRO */}
      <Modal visible={showCountryPicker} animationType="slide" transparent={false}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={styles.modalHeaderCustom}>
            <Text style={styles.modalHeaderTitle}>Selecciona tu país</Text>
          </View>
          <CountryPicker
            countryCode={countryCode}
            visible={showCountryPicker}
            onSelect={(c) => { onSelect(c); setShowCountryPicker(false); }}
            onClose={() => setShowCountryPicker(false)}
            withFilter
            withFlag={true} // <--- ESTA LÍNEA ES LA QUE FALTA
            withEmoji={true} // Para asegurar que se renderice el icono o emoji de la bandera
            withAlphaFilter
            withCallingCode
            withModal={false}
            theme={{ 
              backgroundColor: '#000', 
              onBackgroundTextColor: '#fff', 
              fontSize: 16,
              filterPlaceholderTextColor: '#666'
            }}
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
    borderWidth: 2,
    borderColor: BRAND_PINK,
    shadowColor: BRAND_PINK,
    shadowRadius: 10,
    elevation: 5,
  },
  neonTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: BRAND_PINK,
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(255, 60, 172, 0.5)',
    textShadowRadius: 10,
  },
  googleSection: { alignItems: 'center', marginBottom: 25 },
  subText: { color: '#666', marginBottom: 10, fontSize: 13 },
  gymBadge: { 
    marginTop: 15, 
    paddingVertical: 6, 
    paddingHorizontal: 15, 
    borderRadius: 15, 
    backgroundColor: GREEN_FADE, 
    borderWidth: 1, 
    borderColor: BRAND_GREEN 
  },
  gymBadgeText: { color: BRAND_GREEN, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  inputWrapper: { width: '100%', marginBottom: 18 },
  row: { flexDirection: 'row', width: '100%' },
  label: { color: BRAND_PINK, fontSize: 12, marginBottom: 6, marginLeft: 4, fontWeight: '600' },
  neonInput: { height: 50, backgroundColor: '#000', borderRadius: 12, borderWidth: 1, borderColor: PINK_FADE, color: '#fff', paddingHorizontal: 15 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', borderRadius: 12, borderWidth: 1, borderColor: PINK_FADE },
  passwordInput: { flex: 1, height: 50, color: '#fff', paddingHorizontal: 15 },
  showHideText: { color: BRAND_PINK, fontSize: 10, fontWeight: 'bold', paddingRight: 15 },
  phoneContainer: { flexDirection: 'row', height: 50, backgroundColor: '#000', borderRadius: 12, borderWidth: 1, borderColor: PINK_FADE, overflow: 'hidden' },
  countryBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, backgroundColor: '#111', borderRightWidth: 1, borderRightColor: PINK_FADE },
  flag: { width: 25, height: 18, marginRight: 8, borderRadius: 2 },
  callingCode: { color: BRAND_PINK, fontWeight: 'bold' },
  phoneInput: { flex: 1, color: '#fff', paddingHorizontal: 15 },
  dateBtn: { height: 50, backgroundColor: '#000', borderRadius: 12, borderWidth: 1, borderColor: PINK_FADE, justifyContent: 'center', paddingHorizontal: 15 },
  dateText: { color: '#fff' },
  pickerContainer: { backgroundColor: '#000', borderRadius: 12, borderWidth: 1, borderColor: PINK_FADE, overflow: 'hidden' },
  submitBtn: { width: '100%', height: 55, backgroundColor: '#000', borderRadius: 15, borderWidth: 2, borderColor: BRAND_PINK, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: BRAND_PINK, fontSize: 16, fontWeight: 'bold', letterSpacing: 2 },
  backToLoginBtn: { marginTop: 25, paddingVertical: 10, alignItems: 'center', width: '100%' },
  backToLoginText: { color: '#666', fontSize: 14, fontWeight: '500' },
  backToLoginHighlight: { color: BRAND_GREEN, fontWeight: 'bold', textDecorationLine: 'underline' },
  modalHeaderCustom: { 
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#222',
    backgroundColor: '#000',
    alignItems: 'center'
  },
  modalHeaderTitle: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  }
});


