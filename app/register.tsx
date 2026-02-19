import { router } from "expo-router";
import React, { useContext, useState, useEffect } from "react";
import { UserContext } from "../components/UserContext";
import { BotonMostrar, Container, FieldGroup, Fields, SubmitF, TextInputEntrada, TextoBoton, Title } from "../styles/registerStyles";
import { enviarDatosRegistro } from '../services/api';

export default function Screen1() {

  const {users, setUsers} = useContext(UserContext);//Importacionde los datos desde UserContext Compartidos
  const [nombre, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [apellido, setLastName] = useState("")
  const [telefono, setNumberPhone] = useState("")
  const [secure, setSecure] = useState(true);
    

 //Funcion principal del formulario
 const handlRegister = async () =>{
    if (!nombre || !email || !password || !apellido || !telefono){
        alert("Todos los campos deben de ser obligatorios")
    return;
    }

    if (!validarEmail(email)) { 
        alert("El correo electrónico no es válido"); 
    return; }

    const NewUsers = {nombre, password, email, apellido, telefono}
    setUsers([...users, NewUsers]/*Guardamos en memeoria compartida*/)
    console.log("Usuarios en memoria:", users); 

    try { //Funcion para enviar datos se uso NewUser para mostrar datos antes
    const resultado = await enviarDatosRegistro(NewUsers);
    console.log("Datos en la web de pruebas:", resultado);
    alert("¡Registro enviado a la API!");
    } catch (error) {
    alert("Error de conexión con la API");
    }

    alert("Usuario registrado en memoria");
    return router.replace("/");

 }

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


