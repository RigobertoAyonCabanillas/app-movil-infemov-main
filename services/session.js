import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_AUTH_URL = 'http://100.116.49.102:5254/api/auth';

export const limpiarDatosLocales = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('token');
    
    if (token) {
      // Notificamos al servidor C# sin esperar (no bloqueante)
      fetch(`${BASE_AUTH_URL}/logout`, {
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