import { useRouter } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { Button, TouchableOpacity } from "react-native";
import BtnLoginGoogle from "../components/BtnLoginGoogle";
import { UserContext } from "../components/UserContext";
import { Container, MultiAccount, Registros, TextInputEntrada, Title } from "../styles/loginStyle";
import { useAuthService } from "@/servicesdb/authService";


export default function Login() {

const {users} = useContext(UserContext)
const [user, setUser] = useState("");
const [password, setPassword] = useState("");
const [email, setEmail] = useState("");
    
const router = useRouter();


//Obtienes la función del servicio
const { loginUsuarioProceso } = useAuthService();

const handleLogin = async () => {
  // Validación básica de campos
  if (!email.trim() || !password.trim()) {
    alert("Por favor, ingresa tus credenciales");
    return;
  }

  // 2. Llamas al proceso que busca en SQLite
  await loginUsuarioProceso(email, password);
};

console.log("Usuarios disponibles:", users);


  return (
    
    <Container> 
        <Title> Login</Title>
      
        <TextInputEntrada //Ingresar Nombre usuario
         placeholder="Usuario"
         value={email}
         onChangeText = {(text) => setEmail(text)}
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
