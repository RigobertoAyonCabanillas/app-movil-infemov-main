import { router, useFocusEffect } from "expo-router";
import { useContext, useCallback } from 'react';
import { Container, Title } from "../../styles/homeStyles";
import { UserContext } from '../../components/UserContext'; 

// Importamos el servicio de sincronización
import { useAuthService } from "@/servicesdb/authService";

export default function Home() {
  const { users } = useContext(UserContext);
  const { sincronizarPerfil } = useAuthService();

  // Esta función se ejecuta cada vez que el usuario entra al Home
  useFocusEffect(
    useCallback(() => {
      const currentId = users?.id || users?.Id;
      const currentCorreo = users?.correo || users?.Correo;

      // SI tenemos datos básicos PERO aún no sabemos el rol o el gymId completo
      // (Esto es lo que evita que las pestañas se queden como cliente)
      if (currentId && currentCorreo && !users?.rol) {
        console.log("🚀 Sincronización automática en Home detectada...");
        
        sincronizarPerfil(currentId, currentCorreo)
          .then(() => {
            console.log("✅ Perfil actualizado a:", users?.rol);
          })
          .catch((error) => {
            console.error("❌ Error en sincronización inicial:", error);
          });
      }
    }, [users]) // Se dispara si el objeto 'users' cambia
  );

  return (
    <Container> 
      <Title>Página principal</Title>
      {/* Aquí podrías poner un resumen de clases si es Coach */}
    </Container>   
  );
}