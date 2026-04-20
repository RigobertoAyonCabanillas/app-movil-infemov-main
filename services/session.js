import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './api'; 
// Cambiamos la importación a la ruta legacy para mantener compatibilidad
import * as FileSystem from 'expo-file-system/legacy'; 

export const limpiarDatosLocales = async () => {
  try {
    // 1. Intentar notificar al backend el cierre de sesión
    const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('token');
    
    if (token) {
      fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Token: token })
      }).catch(() => console.log("Servidor C# no alcanzable..."));
    }

    // 2. BORRADO FÍSICO DE LA BASE DE DATOS
    // Nota: SQLite suele añadir la extensión .db internamente
    const dbPath = `${FileSystem.documentDirectory}SQLite/bdMovilFinal`; 
    
    // En lugar de verificar con getInfoAsync (que da el error), 
    // intentamos borrar directamente con idempotent: true
    try {
      await FileSystem.deleteAsync(dbPath, { idempotent: true });
      console.log("Archivo de base de datos eliminado.");
    } catch (e) {
      console.log("No se pudo eliminar el archivo o no existía.");
    }

    // 3. LIMPIEZA DE ASYNC STORAGE
    await AsyncStorage.clear();
    
    console.log("Sesión y datos locales limpiados con éxito.");
    return true;
  } catch (error) {
    console.error("Error crítico durante la limpieza de datos:", error);
    return false;
  }
};