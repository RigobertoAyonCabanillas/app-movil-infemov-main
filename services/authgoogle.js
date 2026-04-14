import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { desencriptarDatos } from './api';
import { limpiarDatosLocales } from './session'; // Importamos la lógica de sesión

// Definimos la base de la URL para poder reutilizarla
import { API_URL } from './api'; // <--- Importamos la constante

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
    const response = await fetch(`${API_URL}/google-auth`, {
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
    // Manejo de Google independiente para evitar errores en iPhone
    try {
      await GoogleSignin.signOut();
    } catch (e) {
      console.log("ℹ️ Google ya cerrado o no inicializado");
    }

    // Llamamos a la limpieza de tokens y AsyncStorage
    const exito = await limpiarDatosLocales();
    return exito;
  } catch (error) {
    console.error("❌ Error en logout universal:", error);
    return false;
  }
};