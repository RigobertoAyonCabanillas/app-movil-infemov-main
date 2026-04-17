import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './api'; // <--- Importamos la constante
import * as FileSystem from 'expo-file-system';

export const limpiarDatosLocales = async () => {
  try {
    // 1. Intentar notificar al backend el cierre de sesión
    const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('token');
    
    if (token) {
      // Usamos el endpoint de logout que mencionaste antes
      fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Token: token })
      }).catch(() => console.log("Servidor C# no alcanzable, continuando limpieza local..."));
    }

    // 2. BORRADO FÍSICO DE LA BASE DE DATOS
    // Usamos el nombre 'bdMovilFinal' que tienes configurado en tu inicialización de Drizzle
    const dbPath = `${FileSystem.documentDirectory}SQLite/bdMovilFinal`; 
    const dbInfo = await FileSystem.getInfoAsync(dbPath);

    if (dbInfo.exists) {
      await FileSystem.deleteAsync(dbPath, { idempotent: true });
      console.log("Archivo de base de datos 'bdMovilFinal' eliminado.");
    }

    // 3. LIMPIEZA DE ASYNC STORAGE
    // Esto borra tokens, IDs de usuario y cualquier otra persistencia simple
    await AsyncStorage.clear();
    
    console.log("Sesión y datos locales limpiados con éxito.");
    return true;
  } catch (error) {
    console.error("Error crítico durante la limpieza de datos:", error);
    return false;
  }
};