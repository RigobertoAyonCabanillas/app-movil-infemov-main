const API_URL = 'http://100.116.49.102:5254/api/auth/google-register'; 

export const enviarLoginGoogle = async (userData) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      // Enviamos el objeto plano con los parámetros que necesitas
      body: JSON.stringify({
        IdToken: userData,
        /*googleId: userData.id,
        foto: userData.picture*/
      }),
    });
    if (!response.ok) {
      throw new Error(`Error en el servidor: ${response.status}`);
    }
    console.log("Datos Enviados Correctamente");
    return await response.json();
  } catch (error) {
    console.error("Error al enviar datos:", error);
    throw error;
  }
};