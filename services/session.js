import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './api'; 
import * as FileSystem from 'expo-file-system/legacy'; 

export const limpiarDatosLocales = async () => {
  try {
    // 1. Obtener token antes de borrar nada
    const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('token');
    
    // 2. NOTIFICAR AL BACKEND (SIN AWAIT)
    // No usamos 'await' aquí para que si el internet falla, 
    // el código siga ejecutándose sin detenerse.
    if (token) {
      console.log("Intentando notificar logout al servidor...");
      fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Token: token })
      }).catch(() => {
        // Si entra aquí es porque no hay internet o el servidor cayó.
        // Solo lo logueamos, no detenemos el proceso.
        console.log("Servidor no alcanzable, continuando borrado local...");
      });
    }

    // 3. BORRADO FÍSICO DE LA BASE DE DATOS
    const dbPath = `${FileSystem.documentDirectory}SQLite/bdMovilFinal`; 
    try {
      await FileSystem.deleteAsync(dbPath, { idempotent: true });
      console.log("Archivo de base de datos eliminado.");
    } catch (e) {
      console.log("No se pudo eliminar el archivo o no existía.");
    }

    // 4. LIMPIEZA DE ASYNC STORAGE (IMPORTANTE: HACERLO AL FINAL)
    await AsyncStorage.clear();
    
    console.log("Sesión y datos locales limpiados con éxito.");
    return true;
  } catch (error) {
    // Si algo falla, intentamos al menos limpiar el Storage para que el usuario pueda re-loguear
    await AsyncStorage.clear().catch(() => {});
    console.error("Error crítico durante la limpieza de datos:", error);
    return false;
  }
};