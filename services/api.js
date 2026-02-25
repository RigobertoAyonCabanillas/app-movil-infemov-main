import CryptoJS from 'crypto-js';

const API_URL = 'http://192.168.0.137:5254/api/auth';
// IMPORTANTE: Esta llave debe tener exactamente 16, 24 o 32 caracteres
// Debe ser la misma que pongas en tu código de C#
const SECRET_KEY = "k3P9zR7mW2vL5xN8"; 

export const desencriptarDatos = (datosCifrados) => {
  try {
    const key = CryptoJS.enc.Utf8.parse(SECRET_KEY);
    const bytes = CryptoJS.AES.decrypt(datosCifrados, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    });

    const textoOriginal = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!textoOriginal) {
      throw new Error("No se pudo desencriptar: resultado vacío. Revisa la llave o el padding.");
    }

    return JSON.parse(textoOriginal);
  } catch (error) {
    console.error("❌ Error al desencriptar:", error);
    return null;
  }
};

//Registro local
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

    const response = await fetch(`${API_URL}/register`, {
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

//Login
export const enviarDatosLogin = async (correo, contrasena) => {
  try {
    // 1. Preparamos el objeto con las credenciales
    const datos = {
      email: correo,
      password: contrasena
    };

    const jsonString = JSON.stringify(datos);

    // 2. Ciframos usando la misma configuración de Registro (ECB / Pkcs7)
    const key = CryptoJS.enc.Utf8.parse(SECRET_KEY);
    const cifrado = CryptoJS.AES.encrypt(jsonString, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    });

    const datosParaEnviar = cifrado.toString();

    // 3. Petición Fetch
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        Data: datosParaEnviar 
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Credenciales incorrectas o error: ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ Login exitoso");
    console.log("🚀 DATOS RECIBIDOS DEL API:", JSON.stringify(data, null, 2));


    return data; // Aquí debería venir el usuario y el token desde .NET

  } catch (error) {
    console.error("❌ Error en login:", error);
    throw error;
  }
};