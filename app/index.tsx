import { useRouter } from "expo-router";
import { useContext, useRef } from "react"; // 1. Importamos useRef
import { Alert, TouchableOpacity } from "react-native";
import { UserContext } from "../components/UserContext";
import { 
  Container, 
  Registros, 
  TextInputEntrada, 
  Title, 
  FormGroup, 
  BotonEntrar, 
  BotonTexto 
} from "../styles/loginStyle";
import { useAuthService } from "@/servicesdb/authService";
import { enviarDatosLogin } from "@/services/api";

export default function Login() {
  const { users } = useContext(UserContext);
  const router = useRouter();
  const { loginUsuarioProceso } = useAuthService();

  // 2. Usamos Refs para que NO se renderice al escribir
  const emailRef = useRef("");
  const passwordRef = useRef("");

  const handleLogin = async () => {
    // 3. Obtenemos los valores actuales de los refs
    const email = emailRef.current;
    const password = passwordRef.current;

    if (!email.trim() || !password.trim()) {
      Alert.alert("Atención", "Por favor, ingresa tus credenciales"); 
      return;
    }

    try {
      const respuestaApi = await enviarDatosLogin(email, password);

      if (respuestaApi) {
        await loginUsuarioProceso(email, password); 
        router.replace("/(tabs)/home");
      }
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : "Error desconocido";
      Alert.alert("Error de Autenticación", mensaje);
      console.error(error);
    }
  };

  // Este log solo se verá cuando el componente cargue, 
  // ya no se repetirá cada vez que escribas.
  console.log("Usuarios disponibles:", users);

  return (
    <Container>
      <Title>Login</Title>

      <FormGroup>
        <TextInputEntrada
          placeholder="Correo"
          defaultValue=""
          onChangeText={(text: string) => (emailRef.current = text)}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInputEntrada
          placeholder="Contraseña"
          defaultValue=""
          secureTextEntry={true}
          onChangeText={(text: string) => (passwordRef.current = text)}
        />

        <BotonEntrar onPress={handleLogin}>
          <BotonTexto>ENTRAR</BotonTexto>
        </BotonEntrar>

        {/* Usamos Registros directamente si ya es un styled component Touchable u otro */}
        <TouchableOpacity onPress={() => router.push("/register")}>
          <Registros>Registro</Registros>
        </TouchableOpacity>
      </FormGroup>
    </Container>
  );
}