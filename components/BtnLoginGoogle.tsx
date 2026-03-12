import { Text, View } from "react-native";
import styled from "styled-components/native";
import * as Google from 'expo-auth-session/providers/google'
import * as AuthSession from 'expo-auth-session';
import { useEffect } from "react";
import { enviarLoginGoogle } from "../services/authgoogle"
import * as WebBrowser from 'expo-web-browser';
import { useAuthService } from '@/servicesdb/authService';
import { FontAwesome } from '@expo/vector-icons'; // Importamos el ícono
import { ContainerIcono, BtnGoogleCircular } from '@/styles/btnGoogleStyles'

WebBrowser.maybeCompleteAuthSession();

export default function BtnLoginGoogle({ folioExterno }: { folioExterno: any }) {
  const { guardarUsuarioEnSQLite } = useAuthService();
  const scheme = 'com.infemov.appmovil';

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '71333420449-c72hsae5vkt6uhm3j67pmd004365aom6.apps.googleusercontent.com',
    webClientId: '71333420449-5dkid1qm5c17pc1r45i30lvvf9mh7rsb.apps.googleusercontent.com',
    scopes: [
      'profile', 
      'email',
      'https://www.googleapis.com/auth/user.phonenumbers.read',
      'https://www.googleapis.com/auth/user.birthday.read'
    ],
    redirectUri: AuthSession.makeRedirectUri({
      native: `${scheme}:/`, 
    }),
  });

  useEffect(() => {
    const validarYRedirigir = async () => {
      if (response && response.type === 'success') {
        const accessToken = response.authentication?.accessToken;
        const idToken = response.authentication?.idToken || response.params?.id_token;
        
        if (!accessToken) return;

        // PASO CLAVE: Enviamos el folioExterno a tu función de login
        // Asegúrate de que enviarLoginGoogle acepte este tercer parámetro
        const verificado = await enviarLoginGoogle(accessToken, idToken, folioExterno);// Para el api
        if (verificado?.Token || verificado?.token) {
          const datosParaSQLite = { //Parte para local
            nombres: verificado.user?.nombre || "", 
            apellidoPaterno: verificado.user?.apellido || "",
            apellidoMaterno: verificado.user?.apellodp || "",
            correo: verificado.user?.email || "",
            token: verificado.token || verificado.Token,
            superUsuario: verificado.superUsuario,
          };
          console.log("Datos de google para sqlite", datosParaSQLite)
          await guardarUsuarioEnSQLite(datosParaSQLite);//Esto es para la parte local SQlite
        }
      }
    };
    validarYRedirigir();
  }, [response]);

  return (
    <ContainerIcono>
      <BtnGoogleCircular 
        disabled={!request} 
        onPress={() => promptAsync().catch((e) => console.log("Error", e))}
      >
        <FontAwesome name="google" size={28} color="#DB4437" />
      </BtnGoogleCircular>
    </ContainerIcono>
  );
}

