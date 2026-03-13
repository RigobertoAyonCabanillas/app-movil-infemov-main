import { router } from "expo-router";
import React, { useContext, useState, useEffect, useRef } from "react";
import { UserContext } from "../components/UserContext";
import { BotonMostrar, Container, FechaRow, FieldGroup, Fields, InputFechaCorta, PickerContainer, StyledPicker, SubmitF, TextInputEntrada, TextoBoton, Title, MultiAccount } from "../styles/registerStyles";
import { useAuthService } from "@/servicesdb/authService";
import * as Application from 'expo-application';
import { Alert, Platform, ScrollView, KeyboardAvoidingView, TouchableOpacity, View, Text, Image, Modal,  } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from "@react-native-picker/picker";// Fecha Nacimiento
import DateTimePicker from '@react-native-community/datetimepicker';//Rueda de fecha de namcimiento
//Libreriar para el numero de celular - MaskInput y CountryPicker
import MaskInput from 'react-native-mask-input';
import CountryPicker, { CountryCode, Country, Flag } from 'react-native-country-picker-modal';
import { validarFolioAPI } from "@/services/api";
//Registro con Google
import BtnLoginGoogle from "../components/BtnLoginGoogle";
import { FontAwesome } from '@expo/vector-icons'; // Asegúrate de tener esta importación
import { TextInput } from "react-native-paper";
import { useLocalSearchParams } from 'expo-router'; // Asegúrate de importar esto


export default function Registro() {

  const {users, setUsers} = useContext(UserContext);//Importacionde los datos desde UserContext Compartidos
  const [nombre, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [apellidoPaterno, setLastNameP] = useState("")
  const [apellidoMaterno, setLastNameM] = useState("")
  const [telefono, setNumberPhone] = useState("")
  const [secure, setSecure] = useState(true);
  const [esEstudiante, setEsEstudiante] = useState<number>(0); // 0: No, 1: Sí

//Celular
const [countryCode, setCountryCode] = useState<CountryCode>('MX');
const [showCountryPicker, setShowCountryPicker] = useState(false);
const [callingCode, setCallingCode] = useState('52');
const [telefonoLimpio, setTelefonoLimpio] = useState(''); // Solo números
// Formato: (644) 123-4567
const phoneMask = ['(', /\d/, /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/];
const onSelect = (country: Country) => {
  setCountryCode(country.cca2);
  setCallingCode(country.callingCode[0]);
};

// Estados para los valores de fecha
const [date, setDate] = useState(new Date());
const [show, setShow] = useState(false);
const [fechaTexto, setFechaTexto] = useState("Selecciona tu fecha");

//Folio - superUsuario
const params = useLocalSearchParams(); // Recibimos lo que mande el Login
// Ahora el gymSelected y nombreGimnasio vienen de los parámetros
const [gymSelected, setGymSelected] = useState<number | null>(Number(params.gymId) || null);
const [nombreGimnasio, setNombreGimnasio] = useState(params.gymNombre || "");


//Estados de la base de datos SQLlite
const { registrarUsuarioProceso } = useAuthService();
    
 //Funcion principal del formulario
 const handlRegister = async () => {
  //  Validación de campos existentes
  if (!nombre || !email || !password || !apellidoPaterno || !apellidoMaterno || !telefono) {
    alert("Todos los campos son obligatorios");
    return;
  }

  // 2. NUEVA VALIDACIÓN: Complejidad de Contraseña (Igual a tu Backend)
  const complejidadRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  
  if (password.includes(" ") || !complejidadRegex.test(password)) {
    alert("La contraseña no cumple con los requisitos de seguridad. Debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y no contener espacios.");
    return;
  }

  //  Validación de la opción de Estudiante
  if (esEstudiante === 0) {
    alert("Por favor, selecciona si eres estudiante");
    return;
  }

  if (!validarEmail(email)) {
    alert("El correo electrónico no es válido");
    return;
  }

  try {
    //  OBTENER DEVICE ID (Lógica corregida con await)
    let deviceId: string | null = null;

    if (Platform.OS === 'android') {
        // Cambiamos Application.androidId por el método que te pide VS Code
        deviceId = await Application.getAndroidId(); 
    } else {
        deviceId = await Application.getIosIdForVendorAsync();
    }

    //Fecha de nacimiento
    const fechaFinal = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    //Limpiar () en numero de celular
    const numeroLimpio = telefono.replace(/\D/g, ''); // Quita ( ) y -

    //  Crear el objeto con el campo deviceId incluido
    // Importante: Los nombres de las propiedades deben coincidir con lo que espera tu API .NET
    const NewUser = { 
      nombre, 
      apellidoPaterno, 
      apellidoMaterno,
      email,
      password, 
      telefono: `+${callingCode}${telefonoLimpio}`, // Resultado: +52 6441234567      password, 
      deviceId, // Ahora ya tiene el valor del await anterior
      estudiante: esEstudiante === 1, // <--- Enviamos true si es 1, false si es 2
      fechaNacimiento: fechaFinal, // Así llega como string "DD/MM/AAAA" a tu API
      gymId: gymSelected // Este es el ID que nos dio la API al validar el folio
    };

    // Proceso de Registro (SQLite + Cifrado + API)
    // Asegúrate que en authService.ts, registrarUsuarioProceso acepte este objeto 'NewUser'
    await registrarUsuarioProceso(NewUser);

    //  Actualizar Contexto y Navegar
    setUsers(NewUser);
    alert("Registro exitoso");
    router.replace("/"); 

  } catch (error) {
    console.error("Error en el proceso de registro:", error);
    alert("Error en el proceso de registro. Inténtalo de nuevo.");
  }
};

  //Fecha de nacimiento
  const onData = (event: any, selectedDate?: Date) => {
  // En Android, si el usuario cancela, event.type es 'dismissed'
  if (event.type === 'dismissed') {
    setShow(false);
    return;
  }

  const currentDate = selectedDate || date;
  setShow(false); // Cerramos el picker
  setDate(currentDate);

  let f = currentDate.getDate().toString().padStart(2, '0') + '/' + 
          (currentDate.getMonth() + 1).toString().padStart(2, '0') + '/' + 
          currentDate.getFullYear();
  setFechaTexto(f);
};

 //Funcion para validar correo correctamente
 const validarEmail = (email: string) => 
    { const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; //@antes, @despues, punto(.) despues(.mx ejemplo)
    return regex.test(email); };

  //JSX
  return (
  <KeyboardAvoidingView 
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    style={{ flex: 1, backgroundColor: '#fff' }}
  >
    <ScrollView 
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 50 }}
      showsVerticalScrollIndicator={false}
    >
      <Container> 

          /* --- VISTA B: FORMULARIO COMPLETO --- */
          <>
            <Title>Registrarse</Title>
            
            <FieldGroup>
              <MultiAccount>También Puede Registrarse Con:</MultiAccount>
              <BtnLoginGoogle folioExterno={gymSelected} />
              <Text style={{ color: '#7da854', fontWeight: 'bold', marginTop: 10 }}>
                Gimnasio: {nombreGimnasio}
              </Text>
            </FieldGroup>

            <FieldGroup>
              <Fields>Nombre</Fields>
              <TextInputEntrada onChangeText={setUser} placeholder="Tu nombre" />
            </FieldGroup>

            <FieldGroup>
              <Fields>Apellido Paterno</Fields>
              <TextInputEntrada onChangeText={setLastNameP} placeholder="Apellido Paterno" />
            </FieldGroup>

            <FieldGroup>
              <Fields>Apellido Materno</Fields>
              <TextInputEntrada onChangeText={setLastNameM} placeholder="Apellido Materno" />
            </FieldGroup>

            <FieldGroup>
              <Fields>Contraseña</Fields>
              <TextInputEntrada 
                secureTextEntry={secure}
                autoCapitalize="none"
                onChangeText={setPassword}
                placeholder="********"
                underlineColorAndroid="transparent"
              />
              
              {/* El botón ahora es pequeño y se alinea a la derecha automáticamente */}
              <BotonMostrar onPress={() => setSecure(!secure)}>
                <TextoBoton>{secure ? "MOSTRAR" : "OCULTAR"}</TextoBoton> 
              </BotonMostrar>
            </FieldGroup>

            <FieldGroup>
              <Fields>Email</Fields>
              <TextInputEntrada 
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="ejemplo@correo.com"
              />
            </FieldGroup>

            <FieldGroup>
              <Fields>Número de Teléfono</Fields>
              <View style={{ flexDirection: 'row', width: '100%', backgroundColor: '#f2f2f2', borderRadius: 8, height: 55, alignItems: 'center', overflow: 'hidden' }}>
                
                {/* BOTÓN DISPARADOR (Mantenemos tu diseño verde) */}
                <TouchableOpacity 
                  onPress={() => setShowCountryPicker(true)} 
                  style={{ 
                    backgroundColor: '#7da854', 
                    paddingHorizontal: 12, 
                    height: '100%', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    flexDirection: 'row', 
                    borderTopLeftRadius: 8,
                    borderBottomLeftRadius: 8
                  }}
                >
                  <View style={{ marginRight: 8 }}>
                    <Image
                      source={{ uri: `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png` }}
                      style={{ width: 25, height: 18, borderRadius: 2 }}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                    +{callingCode}
                  </Text>
                </TouchableOpacity>

                {/* Input para el resto del teléfono (TU MASKINPUT ACTUAL) */}
                <MaskInput
                  value={telefono}
                  onChangeText={(masked, unmasked) => {
                    setNumberPhone(masked);
                    setTelefonoLimpio(unmasked);
                  }}
                  mask={phoneMask}
                  keyboardType="numeric"
                  style={{ flex: 1, paddingHorizontal: 15, fontSize: 16, color: '#333' }}
                  placeholderTextColor="#999"
                  placeholder="(555) 555-5555"
                />
              </View>
            </FieldGroup>

            <FieldGroup>
              <Fields>¿Eres estudiante?</Fields>
              <View style={{ width: '100%', borderBottomWidth: 1, borderBottomColor: '#ccc' }}>
                <Picker
                  selectedValue={esEstudiante}
                  onValueChange={(itemValue) => setEsEstudiante(itemValue)}
                  style={{ height: 50, width: '100%' }}
                >
                  <Picker.Item label="Selecciona una opción..." value={0} color="#999" />
                  <Picker.Item label="Sí, soy estudiante" value={1} />
                  <Picker.Item label="No, no soy estudiante" value={2} />
                </Picker>
              </View>
            </FieldGroup>

            <FieldGroup>
              <Fields>Fecha de Nacimiento</Fields>
              {/* Agregamos una View para contener el área de clic */}
              <View style={{ width: '100%', height: 60, marginBottom: 10 }}> 
                <TouchableOpacity 
                  onPress={() => setShow(true)}
                  style={{ flex: 1 }} // El toque solo vivirá dentro de estos 60px de alto
                >
                  <View pointerEvents="none">
                    <TextInput
                      placeholder="Selecciona tu fecha"
                      value={fechaTexto}
                      editable={false}
                      style={{
                        backgroundColor: '#F0F2F5',
                        height: 55,
                        borderRadius: 10,
                        paddingHorizontal: 15,
                        fontSize: 16,
                        color: fechaTexto === "Selecciona tu fecha" ? '#999' : '#000',
                        borderWidth: 1,
                        borderColor: '#E1E4E8',
                      }}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </FieldGroup>

            <FieldGroup>
              <SubmitF onPress={handlRegister} style={{ marginTop: 10 }}>
                <TextoBoton>REGISTRAR</TextoBoton> 
              </SubmitF>
            </FieldGroup>
          </>
        
      </Container>  
    </ScrollView>

    {/* --- MODAL PARA SELECCIONAR PAÍS --- */}
  <Modal
    visible={showCountryPicker}
    animationType="slide"
    transparent={false}
    onRequestClose={() => setShowCountryPicker(false)}
  >
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      
      {/* 1. TU ENCABEZADO CON DISEÑO (Ahora dentro del Modal) */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 20 : 0, 
        backgroundColor: '#fff',
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        elevation: 2
      }}>
        <TouchableOpacity 
          onPress={() => setShowCountryPicker(false)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#F0F2F5',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#333' }}>✕</Text>
        </TouchableOpacity>
        <Text style={{ marginLeft: 15, fontSize: 18, fontWeight: 'bold', color: '#000' }}>
          Selecciona tu país
        </Text>
      </View>

      {/* 2. EL PICKER (Sin su propia X, usando la nuestra) */}
      <CountryPicker
        countryCode={countryCode}
        visible={showCountryPicker}
        onSelect={(country) => {
          onSelect(country);
          setShowCountryPicker(false);
        }}
        onClose={() => setShowCountryPicker(false)}
        withFilter
        withModal={false}
        withAlphaFilter={false}
        renderFlagButton={() => null}
        
        // ESTO QUITA LA "X" VISUALMENTE SIN DAR ERRORES
        theme={{
          onBackgroundTextColor: 'transparent', // Hace que el icono X sea invisible
          backgroundColor: '#ffffff',
        }}

        filterProps={{
        autoFocus: true,
        placeholder: 'Busca tu país...',
        style: {
          height: 48,
          backgroundColor: '#F0F2F5',
          borderRadius: 12,
          color: '#000',
          marginTop: 10,
          width: '100%',           // Aumentamos el ancho para que al moverlo no se acorte
          
          // ESTO MUEVE EL TEXTO AL LUGAR DE LA X OCULTA
          marginLeft: -65,         // Empuja el bloque a la izquierda sobre la X
          paddingLeft: 50,         // Ajusta este número para centrar el texto en el cuadro
        }
      }}
      />
    </SafeAreaView>
  </Modal>

      {/* AQUÍ VA EL PICKER */}
      {show && (
        <DateTimePicker
          value={date}
          mode="date"
          // 'spinner' es mucho más compacto y no rompe el diseño de tu app
          display="spinner" 
          maximumDate={new Date()}
          onChange={onData}
          // Opcional: Esto ayuda a que en algunos Android se vea mejor el fondo
          themeVariant="light" 
        />
      )}
 
  </KeyboardAvoidingView> 
);
}


