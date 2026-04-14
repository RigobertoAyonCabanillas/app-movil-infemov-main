import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './api'; // <--- Importamos la constante


export const limpiarDatosLocales = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('token');
    
    if (token) {
      // Notificamos al servidor C# sin esperar (no bloqueante)
      fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Token: token })
      }).catch(() => console.log("C# Offline"));
    }

    // Limpiamos todo el almacenamiento
    await AsyncStorage.clear();
    return true;
  } catch (error) {
    console.error("Error limpiando sesión:", error);
    return false;
  }
};