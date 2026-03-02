import { Pressable, Text, StyleSheet, Button, View, TouchableOpacity } from "react-native";
import styled, { ThemeProvider } from "styled-components/native";
import * as Google from 'expo-auth-session/providers/google'
import * as AuthSession from 'expo-auth-session';
import { use, useEffect, version } from "react";
import { router, Router } from "expo-router";
import { enviarLoginGoogle } from "../services/authgoogle"
// Componente funcional que representa un botón de login con Google
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthService } from '@/servicesdb/authService'; //guardado con google en sqlite

// ESTA LÍNEA ES VITAL: Pónla justo debajo de los imports, fuera del componente
WebBrowser.maybeCompleteAuthSession();

// ESTA LÍNEA ES VITAL: Pónla justo debajo de los imports, fuera del componente
WebBrowser.maybeCompleteAuthSession();

export default function BtnLoginGoogle() {

  const { guardarUsuarioEnSQLite } = useAuthService();

  // Asegúrate de que el esquema coincida con tu app.json
  const scheme = 'com.infemov.appmovil';

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '71333420449-c72hsae5vkt6uhm3j67pmd004365aom6.apps.googleusercontent.com',
    webClientId: '71333420449-5dkid1qm5c17pc1r45i30lvvf9mh7rsb.apps.googleusercontent.com',
    // SCOPES AGREGADOS PARA TELÉFONO Y CUMPLEAÑOS
    scopes: [
      'profile', 
      'email',
      'https://www.googleapis.com/auth/user.phonenumbers.read',
      'https://www.googleapis.com/auth/user.birthday.read'
    ],
    // Forzamos la redirección nativa directa al paquete
    redirectUri: AuthSession.makeRedirectUri({
      native: `${scheme}:/`, 
    }),
  });
 
  useEffect(() => {
    // Creamos una función interna asíncrona
    const validarYRedirigir = async () => {
      if (response && response.type === 'success') {
        console.log("Respuesta completa de Google:", response);
        
        // EXTRAEMOS AMBOS TOKENS DE LA RESPUESTA
        const accessToken = response.authentication?.accessToken;
        const idToken = response.authentication?.idToken || response.params?.id_token;
        
        console.log("¡ACCESS TOKEN RECIBIDO!:", accessToken);
        console.log("¡IDTOKEN RECIBIDO!:", idToken);

        if (!accessToken) {
          console.log("No se pudo obtener el accessToken");
          return;
        }

        // Mandamos AMBOS tokens al backend
        const verificado = await enviarLoginGoogle(accessToken, idToken);
        
        if (verificado?.Token || verificado?.token) {

          // --- AQUÍ VA LA LÓGICA DE SQLITE ---
          // Preparamos el objeto con lo que responda tu API
          const datosParaSQLite = {
            nombres: verificado.user?.nombre || "", 
            apellidos: verificado.user?.apellido || "",
            correo: verificado.user?.email || "",
            token: verificado.token || verificado.Token,
          };
          console.log("🚀 Datos mapeados para enviar a SQLite:", datosParaSQLite);

          // 2. GUARDAMOS EN SQLITE (Persistencia local)
          await guardarUsuarioEnSQLite(datosParaSQLite);

          // Enviamos a la pantalla principal
          //router.push('/home'); 
        } else {
          // Aquí podrías poner un alert o mensaje de error: "Error en el servidor"
          console.log("La API de C# rechazó el token (Error 400 probablemente)");
        }
      } else if (response && (response.type === 'error' || response.type === 'cancel')) {
        console.log("La autenticación no se completó:", response.type);
      }
    };

    validarYRedirigir(); // Ejecutamos la función interna
  }, [response]); // Se ejecuta cada vez que 'response' cambie

  return (
    <View>
        <BtnGoogle onPress={() => promptAsync().catch((e) => {
          console.log("Error de inicio de sesion", e);
        })}>
          <Text> Login con google </Text>
        </BtnGoogle>
    </View>
  );
}

// Estilos para el botón
const BtnGoogle = styled.TouchableOpacity`
backgroundColor: #8d0000;
padding: 0.4em;
margin-right: 0px;
`;


