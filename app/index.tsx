import { useRouter } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { Alert, Button, TouchableOpacity } from "react-native";
import BtnLoginGoogle from "../components/BtnLoginGoogle";
import { UserContext } from "../components/UserContext";
import { Container, MultiAccount, Registros, TextInputEntrada, Title } from "../styles/loginStyle";
import { useAuthService } from "@/servicesdb/authService";
import { enviarDatosLogin } from "@/services/api";


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

  try {
    // 2. Llamada al API con cifrado AES
    // Esta es la función que definimos en el paso anterior
    const respuestaApi = await enviarDatosLogin(email, password);

    if (respuestaApi) {
      // 3. Si el login en .NET es exitoso, guardamos en SQLite local
      // Aquí usas tu proceso de servicio de base de datos
      await loginUsuarioProceso(email, password); 
      
      // 4. Navegar a las Tabs (Inicio)
      router.replace("/(tabs)/home");
    }
  } catch (error) {
    Alert.alert("Error de Autenticación", error.message);
    console.error(error);
  }

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
