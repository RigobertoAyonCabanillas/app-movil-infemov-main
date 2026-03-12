import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { desencriptarDatos } from './api';


// Definimos la base de la URL para poder reutilizarla
const BASE_AUTH_URL = 'http://100.116.49.102:5254/api/auth'; 

// --- FUNCIÓN DE ENTRADA (Login) ---
export const enviarLoginGoogle = async (accessToken, idToken, folioExterno) => {

  const body = {
    accessToken: accessToken,
    idToken: idToken,
    // CRUCIAL: El nombre debe ser SuperUsuarioId para que C# lo asocie
    SuperUsuarioId: folioExterno, 
  };

  console.log("Datos pal loginGG", body);

  try {
    const response = await fetch(`${BASE_AUTH_URL}/google-auth`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        body
      ),
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

      const token = datosDescifrados?.Token || datosDescifrados?.token;
      const superUsuario = datosDescifrados?.SuperUsuario;

      // 4. Validamos que al menos el token exista para proceder
      if (token) {
          // Guardamos el token en AsyncStorage (como ya lo haces)
          await AsyncStorage.setItem('userToken', token);
          
          // Opcional: Si necesitas el SuperUsuario en futuras sesiones, guárdalo también
          if (superUsuario !== undefined) {
              await AsyncStorage.setItem('superUsuario', superUsuario.toString());
          }

          console.log("✅ Login exitoso, Token y SuperUsuario capturados");
          console.log("Token:", token);
          console.log("SuperUsuario:", superUsuario);

          // IMPORTANTE: Retornamos ambos en el objeto
          return { 
              token: token, 
              superUsuario: superUsuario 
          }; 
      }
    }

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