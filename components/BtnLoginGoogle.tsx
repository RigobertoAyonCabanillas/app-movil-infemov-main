import { Pressable, Text, StyleSheet, Button, View, TouchableOpacity } from "react-native";
import styled, { ThemeProvider } from "styled-components/native";
import * as Google from 'expo-auth-session/providers/google'
import * as AuthSession from 'expo-auth-session';
import { useEffect } from "react";
import { router, Router } from "expo-router";
// Componente funcional que representa un botón de login con Google
import * as WebBrowser from 'expo-web-browser';
// ESTA LÍNEA ES VITAL: Pónla justo debajo de los imports, fuera del componente
WebBrowser.maybeCompleteAuthSession();


export default function BtnLoginGoogle() {

// ... dentro de tu función BtnLoginGoogle
const [ request, response, promptAsync ] = Google.useAuthRequest({
  androidClientId: '751362745566-sj0lik9apclpp6i2h1psh9spkj4rd7lf.apps.googleusercontent.com',
  // CAMBIO CLAVE: Usa el nombre del paquete que registraste en Google
  redirectUri: AuthSession.makeRedirectUri({
    scheme: 'com.infemov.appmovil', 
  }),
  webClientId:'',
});

  const enviarTokenalServer = async (token: string) => {
    console.log(token);
    //Logica que se envia al server
    router.push('/home');
  }

  console.log(response)
  
  useEffect(() => {
  if (response) {
    console.log("Respuesta completa de Google:", response); // Revisa esto en la terminal
    
    if (response.type === 'success') {
      // Intenta sacar el token de ambos lugares posibles
      const token = response.authentication?.idToken || response.params?.id_token;
      console.log("¡TOKEN RECIBIDO!:", token); 
      enviarTokenalServer(token || '');
    } else if (response.type === 'error' || response.type === 'cancel') {
      console.log("La autenticación no se completó:", response.type);
    }
  }
}, [response]);


  return (
    <View>
        <BtnGoogle onPress={() => promptAsync().catch((e) => {
          console.log("Error de inicio de sesion", e);
        })}
        >
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
