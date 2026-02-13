import { useRouter } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { Button, TouchableOpacity } from "react-native";
import BtnLoginGoogle from "../components/BtnLoginGoogle";
import { UserContext } from "../components/UserContext";
import { Container, MultiAccount, Registros, TextInputEntrada, Title } from "../styles/loginStyle";


export default function Screen1() {

const {users} = useContext(UserContext)
const [user, setUser] = useState("");
const [password, setPassword] = useState("");
const [email, setEmail] = useState("");
    
const router = useRouter();

const handleLogin = () =>{
    const usuario = users.find(
      (u) => u.userName === user && u.passwordNew === password
    );

     if(usuario){
      alert("Login Exitoso")
      router.push("/home")
     }else{
      alert("Credencial Incorrecta")
     }

};
console.log("Usuarios disponibles:", users);


  return (
    
    <Container> 
        <Title> Login</Title>
      
        <TextInputEntrada //Ingresar Nombre usuario
         placeholder="Usuario"
         value={user}
         onChangeText = {(text) => setUser(text)}
         />
      
        <TextInputEntrada //Ingresar Contraseña usuario
        placeholder="Constraseña"
        value={password}
        onChangeText = {(text) => setPassword(text)}//
        />
       

        <Button title="Entrar" //Boton login
        onPress={handleLogin}>
        </Button>

        <TouchableOpacity
        //Resitro usuario
        >
          <Registros onPress={()=> router.push("/register")}>
            Registro
          </Registros>
        </TouchableOpacity>

      <MultiAccount> Entrar Con: </MultiAccount>
      <BtnLoginGoogle/>


    </Container>   
    
    
  );
}
