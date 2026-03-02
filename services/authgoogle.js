import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { desencriptarDatos } from './api';


// Definimos la base de la URL para poder reutilizarla
const BASE_AUTH_URL = 'http://100.116.49.102:5254/api/auth'; 

// --- FUNCIÓN DE ENTRADA (Login) ---
export const enviarLoginGoogle = async (accessToken, idToken) => {
  try {
    const response = await fetch(`${BASE_AUTH_URL}/google-auth`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken: accessToken, // Obligatorio para C#
        IdToken: idToken          // Opcional/Adicional para C#
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Detalle de error del servidor:", errorText);
      throw new Error(`Error en el servidor: ${response.status}`);
    }

    // Aquí el backend ya respondió, pero todavía está en bruto (HTTP Response). 
    // Lo conviertes a JSON:
    const data = await response.json();
    console.log("Respuesta completa del backend:", data);
    
  // 1. Extraemos el string cifrado que viene en la propiedad 'Data' (o 'data')
  const base64Cifrado = data?.Data || data?.data;

  if (base64Cifrado) {
      // 2. Usamos tu función de desencriptar
      const datosDescifrados = desencriptarDatos(base64Cifrado);
      console.log("Datos ya descifrados:", datosDescifrados);

      // 3. Ahora sí, accedemos al Token (C# lo envía con 'T' mayúscula según tu objeto)
      const jwtToken = datosDescifrados?.Token || datosDescifrados?.token;

      if (jwtToken) {
          await AsyncStorage.setItem('userToken', jwtToken);
          console.log("✅ Login exitoso y token guardado");
          return { token: jwtToken }; // Retornamos el objeto con el id y token como quieres
      }
  }

    console.log("Token del backend (token):", jwtToken);
    console.log("Login exitoso en API");
    return data;
  } catch (error) {
    console.error("Error al enviar datos:", error);
    throw error;
  }
};

// --- FUNCIÓN DE SALIDA (Logout) ---
export const cerrarSesionUniversal = async () => {
  try {
    // 1. Avisar a tu API de C#
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      try {
        await fetch(`${BASE_AUTH_URL}/logout`, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ Token: token })
        });
        console.log("Notificación de logout enviada a C#");
      } catch (e) {
        console.log("Servidor C# no disponible, continuando localmente...");
      }
    }

    // 2. Cierre de Google (Fuerza bruta para asegurar)
    try {
      // En lugar de preguntar, intentamos cerrar directamente.
      // Si no hay sesión, simplemente no hará nada.
      await GoogleSignin.signOut();
      console.log("Comando signOut de Google ejecutado");
    } catch (googleError) {
      // Este catch captura si no había sesión, evitando que la app truene
      console.log("Google ya estaba cerrado o no era necesario");
    }

    // 3. Limpieza Total
    await AsyncStorage.clear();
    console.log("Almacenamiento local limpiado (Token eliminado)");

    return true; 
    
  } catch (error) {
    console.error("Error crítico:", error);
    await AsyncStorage.clear();
    return true; 
  }
};