import { Pressable, Text, StyleSheet, Button, View, TouchableOpacity } from "react-native";
import styled, { ThemeProvider } from "styled-components/native";
import * as Google from 'expo-auth-session/providers/google'
import * as AuthSession from 'expo-auth-session';
import { useEffect } from "react";
import { router, Router } from "expo-router";
import { enviarLoginGoogle } from "../services/authgoogle"
// Componente funcional que representa un botón de login con Google
import * as WebBrowser from 'expo-web-browser';
// ESTA LÍNEA ES VITAL: Pónla justo debajo de los imports, fuera del componente
WebBrowser.maybeCompleteAuthSession();


export default function BtnLoginGoogle() {

// ... dentro de tu función BtnLoginGoogle
const [ request, response, promptAsync ] = Google.useAuthRequest({
  androidClientId: '751362745566-sj0lik9apclpp6i2h1psh9spkj4rd7lf.apps.googleusercontent.com',
  scopes: ['profile', 'email'], // Importante para que Google suelte el nombre y correo
  // CAMBIO CLAVE: Usa el nombre del paquete que registraste en Google
  redirectUri: AuthSession.makeRedirectUri({
    scheme: 'com.infemov.appmovil', 
  }),
  webClientId:'',
});


  useEffect(() => {
  if (response) {
    if (response.type === 'success') {
      console.log("Respuesta completa de Google:", response); // Revisa esto en la terminal
      // Intenta sacar el token de ambos lugares posibles
      /*const token = response.authentication?.idToken || response.params?.id_token;*/ //aqui solo pido el token

      const { accessToken } = response.authentication;
      
     // Pedimos los datos (nombre, correo, etc.) a Google usando el token
      fetch("https://www.googleapis.com/userinfo/v2/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then(res => res.json())
      .then(user => {
        console.log("Datos obtenidos:", user.name, user.email);
        // Enviamos a tu API
        return enviarLoginGoogle(user);
      })
      .then(() => {
        router.push('/home');
      })
      .catch(err => console.log("Error en el proceso:", err));
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
