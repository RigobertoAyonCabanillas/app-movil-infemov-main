import { router } from "expo-router";
import React, { useContext, useState, useEffect } from "react";
import { UserContext } from "../components/UserContext";
import { BotonMostrar, Container, FieldGroup, Fields, SubmitF, TextInputEntrada, TextoBoton, Title } from "../styles/registerStyles";
import { useAuthService } from "@/servicesdb/authService";

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
 const handlRegister = async () =>{
    if (!nombre || !email || !password || !apellido || !telefono){
        alert("Todos los campos deben de ser obligatorios")
    return;
    }

    if (!validarEmail(email)) { 
        alert("El correo electrónico no es válido"); 
    return;
    }

    //ACTUALIZAR CONTEXTO
    const NewUser = {nombre, password, email, apellido, telefono};
    
    
    try { 
    // ESTA LÍNEA HACE TODO: SQLite + Cifrado + API
    await registrarUsuarioProceso(NewUser);

    //Estado Global: Actualizar el Contexto
    // Si 'users' es un array, añadimos el nuevo; si es un objeto único, lo reemplazamos
    setUsers(NewUser);

    } catch (error) {
      console.error(error);
      alert("Error en el proceso de registro");
      return router.replace("/");
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


