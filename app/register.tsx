import { router } from "expo-router";
import React, { useContext, useState, useEffect, useRef } from "react";
import { UserContext } from "../components/UserContext";
import { BotonMostrar, Container, FechaRow, FieldGroup, Fields, InputFechaCorta, PickerContainer, StyledPicker, SubmitF, TextInputEntrada, TextoBoton, Title } from "../styles/registerStyles";
import { useAuthService } from "@/servicesdb/authService";
import * as Application from 'expo-application';
import { Alert, Platform, ScrollView, KeyboardAvoidingView, TouchableOpacity, } from 'react-native';
import { Picker } from "@react-native-picker/picker";// Fecha Nacimiento
import DateTimePicker from '@react-native-community/datetimepicker';//Rueda de fecha de namcimiento
import PhoneInput from "react-native-phone-number-input";//Numero de celular

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
const [value, setValue] = useState(""); // Número formateado
const [formattedValue, setFormattedValue] = useState(""); // Número con código (+52...)
const phoneInput = useRef<PhoneInput>(null);

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

    const fechaFinal = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;

    //  Crear el objeto con el campo deviceId incluido
    // Importante: Los nombres de las propiedades deben coincidir con lo que espera tu API .NET
    const NewUser = { 
      nombre, 
      apellidoPaterno, 
      apellidoMaterno,
      email, 
      telefono: formattedValue, 
      password, 
      deviceId, // Ahora ya tiene el valor del await anterior
      esEstudiante: esEstudiante === 1, // <--- Enviamos true si es 1, false si es 2
      fechaNacimiento: fechaFinal, // Así llega como string "DD/MM/AAAA" a tu API
    };

    //  Proceso de Registro (SQLite + Cifrado + API)
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
                
                <PhoneInput
                  ref={phoneInput}
                  // ESTO BLOQUEA LAS LETRAS: Solo permite el cambio si el texto son números
                  value={value}
                  defaultValue={value}
                  defaultCode="MX"
                  layout="first"
                  
                  onChangeText={(text) => {
                    // Si el texto nuevo tiene letras, la validación falla y no hace el setValue
                    // Por lo tanto, la letra nunca aparece en pantalla.
                    if (/^\d*$/.test(text)) {
                      setValue(text);
                    }
                  }}

                  onChangeFormattedText={(text) => setFormattedValue(text)}

                  textInputProps={{
                    maxLength: 10,
                    keyboardType: 'number-pad',
                  }}

                  // --- ESTILOS PARA QUE SÍ SE VEA ---
                  containerStyle={{ 
                    width: '82%',                // Volvemos al ancho que cuadra con tus otros inputs
                    height: 60,                  // Subimos un poco la altura para que no se corte el texto
                    borderRadius: 8,
                    backgroundColor: '#f2f2f2', 
                    borderWidth: 1,
                    borderColor: '#bbb7b7',
                    alignSelf: 'center',
                    marginTop: 10,               // Espacio con el label
                    overflow: 'hidden'           // Evita que el contenido se salga del cuadro
                  }}

                  textContainerStyle={{ 
                    backgroundColor: '#f2f2f2',
                    paddingVertical: 0,
                  }}

                  countryPickerButtonStyle={{
                    backgroundColor: '#7da854',
                    width: 60,
                  }}

                  textInputStyle={{
                    fontSize: 16,                // Tamaño estándar para que se vea claro
                    color: '#000',
                    height: '100%',              // Asegura que ocupe todo el espacio vertical
                  }}
                  
                  placeholder="Celular"
                />
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


