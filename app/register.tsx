import { router } from "expo-router";
import React, { useContext, useState, useEffect, useRef } from "react";
import { UserContext } from "../components/UserContext";
import { BotonMostrar, Container, FechaRow, FieldGroup, Fields, InputFechaCorta, PickerContainer, StyledPicker, SubmitF, TextInputEntrada, TextoBoton, Title } from "../styles/registerStyles";
import { useAuthService } from "@/servicesdb/authService";
import * as Application from 'expo-application';
import { Alert, Platform, ScrollView, KeyboardAvoidingView, TouchableOpacity, View, Text } from 'react-native';
import { Picker } from "@react-native-picker/picker";// Fecha Nacimiento
import DateTimePicker from '@react-native-community/datetimepicker';//Rueda de fecha de namcimiento
//Libreriar para el numero de celular - MaskInput y CountryPicker
import MaskInput from 'react-native-mask-input';
import CountryPicker, { CountryCode, Country } from 'react-native-country-picker-modal';

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
  const onData = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShow(false); // Cerramos el picker
    setDate(currentDate);

    // Formateamos para mostrar al usuario en México (DD/MM/AAAA)
    let f = currentDate.getDate().toString().padStart(2, '0') + '/' + 
            (currentDate.getMonth() + 1).toString().padStart(2, '0') + '/' + 
            currentDate.getFullYear();
    setFechaTexto(f);
  };

 //Funcion para validar correo correctamente
 const validarEmail = (email: string) => 
    { const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; //@antes, @despues, punto(.) despues(.mx ejemplo)
    return regex.test(email); };

  return (

      <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      >
        <ScrollView 
          // Esta propiedad es clave para que los inputs y el picker respondan bien al primer toque
          keyboardShouldPersistTaps="handled"
          // Asegura que el contenido se estire para llenar la pantalla
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
        >
          <Container> 

            <Title> Registrarse </Title>
            
            <FieldGroup /*Contenedor para llenar Nombre*/>
                <Fields> Nombre </Fields>
                <TextInputEntrada
                onChangeText={setUser}
                />
            </FieldGroup>

            <FieldGroup /*Contenedor para llenar Apellidos*/>
                <Fields> Apellido Paterno </Fields>
                <TextInputEntrada
                onChangeText={setLastNameP}
                />
            </FieldGroup>

              <FieldGroup /*Contenedor para llenar Apellidos*/>
                <Fields> Apellido Materno </Fields>
                <TextInputEntrada
                onChangeText={setLastNameM}
                />
            </FieldGroup>

            <FieldGroup /*Contenedor para llenar Contraseña*/>
                <React.Fragment>
                    <Fields> Constraseña </Fields>
                    <TextInputEntrada 
                    secureTextEntry={secure} //Estado que muestra o esconde la contraseña
                    autoCapitalize="none" //Evitar mayusculas
                    autoCorrect={false} //evitar auto corrector
                    onChangeText={setPassword}
                    />
                    <BotonMostrar onPress={() => setSecure(!secure)}>
                        <TextoBoton>{secure ? "MOSTRAR" : "OCULTAR"}</TextoBoton> 
                    </BotonMostrar>
                </React.Fragment>
            </FieldGroup>

            <FieldGroup /*Contenedor para llenar Correo*/>
                <Fields> Email </Fields>
                <TextInputEntrada 
                keyboardType="email-address"
                onChangeText={setEmail}/>
            </FieldGroup>

           <FieldGroup style={{ alignItems: 'center', width: '100%' }}>
              <Fields style={{ alignSelf: 'flex-start', marginLeft: '12.8%' }}>Número de Teléfono</Fields>
              
              <View style={{ 
                flexDirection: 'row', 
                width: '82%', 
                backgroundColor: '#f2f2f2', 
                borderRadius: 8, 
                borderWidth: 1, 
                borderColor: '#bbb7b7',
                height: 60,
                alignItems: 'center',
                marginTop: 10
              }}>
                {/* SELECTOR DE PAÍS AUTOMÁTICO */}
                <TouchableOpacity style={{ 
                  backgroundColor: '#7da854', 
                  height: '100%', 
                  paddingHorizontal: 10,
                  flexDirection: 'row',
                  justifyContent: 'center', 
                  alignItems: 'center',
                  borderTopLeftRadius: 7,
                  borderBottomLeftRadius: 7
                }}>
                  <CountryPicker
                    countryCode={countryCode}
                    withFilter
                    withFlag
                    withCallingCode
                    withAlphaFilter
                    onSelect={onSelect}
                    visible={false} // Se activa al tocar
                  />
                  <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 5 }}>
                    +{callingCode}
                  </Text>
                </TouchableOpacity>

                {/* INPUT CON MÁSCARA QUE BLOQUEA LETRAS */}
                <MaskInput
                  value={telefono}
                  onChangeText={(masked, unmasked) => {
                    setNumberPhone(masked);
                    setTelefonoLimpio(unmasked);
                  }}
                  mask={phoneMask}
                  keyboardType="numeric"
                  placeholder="(000) 000-0000"
                  style={{
                    flex: 1,
                    paddingHorizontal: 15,
                    fontSize: 16,
                    color: '#000'
                  }}
                />
              </View>
            </FieldGroup>

            {/* CAMPO NUEVO: ¿Eres estudiante? */}
          <FieldGroup>
            <Fields>¿Eres estudiante?</Fields>
            <PickerContainer style={{ 
              backgroundColor: '#f2f2f2', 
              borderRadius: 8, 
              borderWidth: 1, 
              borderColor: '#bbb7b7',
              marginTop: 10,
              width: '82%',
              alignSelf: 'center',
              overflow: 'hidden' // Para que el Picker respete el borde redondeado en Android
            }}>
              <Picker
                selectedValue={esEstudiante}
                onValueChange={(itemValue) => setEsEstudiante(itemValue)}
                style={{ height: 60, width: '100%' }}
              >
                <Picker.Item label="Selecciona una opción..." value={0} color="#999" />
                <Picker.Item label="Sí, soy estudiante" value={1} />
                <Picker.Item label="No, no soy estudiante" value={2} />
              </Picker>
            </PickerContainer>
          </FieldGroup>

            <FieldGroup>
              <Fields>Fecha de Nacimiento</Fields>
              
              <TouchableOpacity onPress={() => setShow(true)}>
                <TextInputEntrada
                  editable={false}
                  value={fechaTexto}
                  placeholder="Selecciona tu fecha"
                />
              </TouchableOpacity>

              {show && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  // 'spinner' activa el estilo de rueda que buscas
                  display={Platform.OS === 'ios' ? 'spinner' : 'spinner'} 
                  onChange={onData}
                  maximumDate={new Date()}
                  // Puedes personalizar colores si estás en iOS
                  textColor="black" 
                />
              )}
            </FieldGroup>

            <FieldGroup /*Boton para enviar formulario*/>
                <SubmitF onPress={handlRegister}>
                    <TextoBoton> Registrar </TextoBoton> 
                </SubmitF>
            </FieldGroup>

        </Container>  
      </ScrollView>
    </KeyboardAvoidingView> 
  );
}


