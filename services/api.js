// Centralizamos la URL para cambiarla en un solo lugar
/*const API_URL = 'http://192.168.0.120:5254/api/auth/';

export const enviarDatosRegistro = async (datos) => {
  try {
    const response = await fetch(`${API_URL}`, {//EndPoint de enviar
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datos),
    });
    return await response.json();
  } catch (error) {
    throw error;
  }
};*/

import CryptoJS from 'crypto-js';

const API_URL = 'http://100.116.49.102:5254/api/auth/register';

// IMPORTANTE: Esta llave debe tener exactamente 16, 24 o 32 caracteres
// Debe ser la misma que pongas en tu código de C#
const SECRET_KEY = "k3P9zR7mW2vL5xN8"; 

export const enviarDatosRegistro = async (datos) => {
  try {
    // 1. Convertimos el objeto dinámico a string JSON
    const jsonString = JSON.stringify(datos);

    // 2. Ciframos usando AES
    // Usamos el formato Utf8 para la llave para asegurar compatibilidad con .NET
    const key = CryptoJS.enc.Utf8.parse(SECRET_KEY);
    const cifrado = CryptoJS.AES.encrypt(jsonString, key, {
      mode: CryptoJS.mode.ECB, // El modo debe coincidir con el de C#
      padding: CryptoJS.pad.Pkcs7 //Verifica que llegue la misma dimension a C# de 16 128 bits
    });

    // 3. Obtenemos el resultado en Base64 (es lo más fácil de recibir en .NET)
    const datosParaEnviar = cifrado.toString();
    console.log(datosParaEnviar)

    const response = await fetch(`${API_URL}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      // Enviamos el objeto con la propiedad "Data" que espera tu Controller de .NET
      body: JSON.stringify({ 
        Data: datosParaEnviar 
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error en el servidor: ${errorText}`);
    }
    console.log("Datos enviados correctamente")
    return await response.json();
  } catch (error) {
    console.error("Error al cifrar o enviar:", error);
    throw error;
  }
};