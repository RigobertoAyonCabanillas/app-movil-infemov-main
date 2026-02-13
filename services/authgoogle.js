const API_URL = 'http://192.168.0.120:5254/api/auth/google-register'; 

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
        email: userData.email,
        nombre: userData.name,
        /*googleId: userData.id,
        foto: userData.picture*/
      }),
    });

    if (!response.ok) {
      throw new Error(`Error en el servidor: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error al enviar datos:", error);
    throw error;
  }
};