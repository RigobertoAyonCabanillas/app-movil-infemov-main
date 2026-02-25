import { router } from "expo-router";
import React, { useContext, useState, useEffect } from "react";
import { UserContext } from "../components/UserContext";
import { BotonMostrar, Container, FieldGroup, Fields, SubmitF, TextInputEntrada, TextoBoton, Title } from "../styles/registerStyles";
import { useAuthService } from "@/servicesdb/authService";
import * as Application from 'expo-application';
import { Platform } from 'react-native';

export default function Registro() {

  const {users, setUsers} = useContext(UserContext);//Importacionde los datos desde UserContext Compartidos
  const [nombre, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [apellido, setLastName] = useState("")
  const [telefono, setNumberPhone] = useState("")
  const [secure, setSecure] = useState(true);

//Estados de la base de datos SQLlite
const { registrarUsuarioProceso } = useAuthService();
    

 //Funcion principal del formulario
 const handlRegister = async () => {
  // 1. Validación de campos existentes
  if (!nombre || !email || !password || !apellido || !telefono) {
    alert("Todos los campos son obligatorios");
    return;
  }

  if (!validarEmail(email)) {
    alert("El correo electrónico no es válido");
    return;
  }

  try {
    // 2. OBTENER DEVICE ID (Lógica corregida con await)
    let deviceId: string | null = null;

    if (Platform.OS === 'android') {
        // Cambiamos Application.androidId por el método que te pide VS Code
        deviceId = await Application.getAndroidId(); 
    } else {
        deviceId = await Application.getIosIdForVendorAsync();
    }

    // 3. Crear el objeto con el campo deviceId incluido
    // Importante: Los nombres de las propiedades deben coincidir con lo que espera tu API .NET
    const NewUser = { 
      nombre, 
      apellido, 
      email, 
      telefono, 
      password, 
      deviceId // Ahora ya tiene el valor del await anterior
    };

    // 4. Proceso de Registro (SQLite + Cifrado + API)
    // Asegúrate que en authService.ts, registrarUsuarioProceso acepte este objeto 'NewUser'
    await registrarUsuarioProceso(NewUser);

    // 5. Actualizar Contexto y Navegar
    setUsers(NewUser);
    alert("Registro exitoso");
    router.replace("/"); 

  } catch (error) {
    console.error("Error en el proceso de registro:", error);
    alert("Error en el proceso de registro. Inténtalo de nuevo.");
  }
};

 //Funcion para validar correo correctamente
 const validarEmail = (email: string) => 
    { const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; //@antes, @despues, punto(.) despues(.mx ejemplo)
    return regex.test(email); };

  return (
    <Container> 

        <Title> Registrarse </Title>
        
        <FieldGroup /*Contenedor para llenar Nombre*/>
            <Fields> Nombre </Fields>
            <TextInputEntrada
            onChangeText={setUser}
            />
        </FieldGroup>

        <FieldGroup /*Contenedor para llenar Apellidos*/>
            <Fields> Apellidos </Fields>
            <TextInputEntrada
            onChangeText={setLastName}
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

          <FieldGroup /*Contenedor para llenar Numero Celular*/>
            <Fields> Numero de Telefono </Fields>
            <TextInputEntrada
            onChangeText={setNumberPhone}
            />
        </FieldGroup>

        <FieldGroup /*Boton para enviar formulario*/>
            <SubmitF onPress={handlRegister}>
                <TextoBoton> Registrar </TextoBoton> 
            </SubmitF>
        </FieldGroup>
        
    </Container>   
  );
}


