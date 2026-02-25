import { router } from "expo-router";
import { useContext } from 'react';
import { Button, Alert } from "react-native";
import { Container, Title } from "../../styles/homeStyles";
import { UserContext } from '../../components/UserContext'; 

//Importamos la función de salida que me acabas de mostrar
import { cerrarSesionUniversal } from '../../services/authgoogle'; 

export default function Home() {
  const { setUsers } = useContext(UserContext);

  const handleLogout = async () => {
    try {
      //Ejecutamos el cierre de sesión completo:
      // - Avisa a tu API de C# (POST /logout)
      // - Cierra sesión en Google SDK
      // - Limpia el AsyncStorage.clear()
      await cerrarSesionUniversal();

      // 3. Limpiamos el estado global del contexto
      setUsers(null); 
      
      // 4. Mandamos al usuario al Login
      router.replace("/");

      console.log("Flujo de cierre completado con éxito");
    } catch (error) {
      // Si algo falla (ej. la IP 100.116.49.102 no responde)
      Alert.alert("Aviso", "Hubo un detalle al contactar al servidor, pero tu sesión local se cerrará.");
      
      // Forzamos la limpieza local para que el usuario no se quede trabado
      setUsers(null);
      router.replace("/");
    }
  };

  return (
    <Container> 
      <Title>Página principal</Title>
      {/* Usamos handleLogout que ahora es asíncrono */}
      <Button title="Cerrar Sesión" onPress={handleLogout} color="#CC0000" />
    </Container>   
  );
}