import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Definimos la base de la URL para poder reutilizarla
const BASE_AUTH_URL = 'http://192.168.0.120:5254/api/auth'; 

// --- FUNCIÓN DE ENTRADA (Login) ---
export const enviarLoginGoogle = async (idToken) => {
  try {
    const response = await fetch(`${BASE_AUTH_URL}/google-register`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        IdToken: idToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error en el servidor: ${response.status}`);
    }

    const data = await response.json();
    
    // IMPORTANTE: Guarda el token localmente para saber que hay una sesión activa
    await AsyncStorage.setItem('userToken', idToken);
    
    console.log("Login exitoso en API");
    return data;
  } catch (error) {
    console.error("Error al enviar datos:", error);
    throw error;
  }
};

// --- FUNCIÓN DE SALIDA (Logout) ---
export const cerrarSesionGoogle = async () => {
  try {
    // 1. (Opcional) Avisar a tu API de C#
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
        await fetch(`${BASE_AUTH_URL}/logout`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Token: token })
        });
    }

    // 2. Limpiar el SDK de Google (Para que no te de el mismo token siempre)
    await GoogleSignin.signOut();

    // 3. Limpiar almacenamiento local
    await AsyncStorage.clear();

    console.log("Sesión cerrada correctamente");
    return true;
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    throw error;
  }
};