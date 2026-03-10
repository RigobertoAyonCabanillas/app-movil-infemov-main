import CryptoJS from 'crypto-js';

const API_URL = 'http://192.168.0.137:5254/api/auth';
// IMPORTANTE: Esta llave debe tener exactamente 16, 24 o 32 caracteres
// Debe ser la misma que pongas en tu código de C#
const SECRET_KEY = "k3P9zR7mW2vL5xN8"; 

export const desencriptarDatos = (datosCifrados) => {
  try {
    if (!datosCifrados) return null;

    // 1. Parseamos la llave exactamente como bytes UTF8
    const key = CryptoJS.enc.Utf8.parse("k3P9zR7mW2vL5xN8");

    // 2. IMPORTANTE: Para que coincida con C# ECB, debemos pasar el string 
    // directamente a decrypt, pero asegurar que el modo y padding sean exactos.
    const decrypted = CryptoJS.AES.decrypt(datosCifrados, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    });

    // 3. Convertimos a UTF8
    const textoDecodificado = decrypted.toString(CryptoJS.enc.Utf8);

    // LOG DE SEGURIDAD: Esto te dirá qué está saliendo realmente
    console.log("🔓 Texto extraído:", textoDecodificado);

    if (!textoDecodificado) {
      // Si falla, intentamos una conversión de emergencia a Latin1 
      // por si hay problemas de encoding entre .NET y JS
      const fallback = decrypted.toString(CryptoJS.enc.Latin1);
      if (fallback && fallback.includes('{')) return JSON.parse(fallback);
      return null;
    }

    return JSON.parse(textoDecodificado);
  } catch (error) {
    console.error("❌ Error en desencriptación:", error.message);
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

//Folio para el Registro
export const validarFolioAPI = async (folio) => {
  try {
    // 1. Petición al endpoint con el folio en la URL
    const response = await fetch(`${API_URL}/validar-gimnasio/${folio}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
        throw new Error("Folio inválido");
    }

    // 2. Recibes el objeto: { data: "affc1+wLubS..." }
    const resCifrado = await response.json();

    // 3. DESENCRIPTAR AQUÍ
    const jsonDescifrado = desencriptarDatos(resCifrado.data);

    // 4. Convertimos a objeto real solo si es necesario
    // Esto evita el "Unexpected character: o"
    const datosFinales = typeof jsonDescifrado === 'string' 
        ? JSON.parse(jsonDescifrado) 
        : jsonDescifrado;

    // Retornamos el objeto ya limpio: { id: 23, nombre: "empresax" }
    return datosFinales;

  } catch (error) {
    console.error("Error al validar folio:", error);
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

    const dataCifrada = await response.json();
    console.log("✅ Login exitoso");
    console.log("🚀 DATOS RECIBIDOS DEL API:", JSON.stringify(dataCifrada, null, 2));

    // AQUÍ DESENCRIPTAS: Para que el AuthService reciba el objeto JSON 
    // y no un string base64.
    const dataDesencriptada = desencriptarDatos(dataCifrada.data);

    console.log("✅ Login exitoso y data desencriptada");
    console.log("Datos decodificados: ", dataDesencriptada)
    return dataDesencriptada; // Devuelve { usuario: { id: ... }, token: ... }

  } catch (error) {
    console.error("❌ Error en login:", error);
    throw error;
  }
};

// Consulta de información de perfil
export const obtenerDatosPerfil = async (token) => {
  try {
    // 1. Petición GET limpia. No enviamos body porque el ID sale del Token en .NET
    const response = await fetch(`${API_URL}/profile`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // 👈 Esto es lo que lee el [Authorize]
      },
    });

    console.log("Header enviado:", token);

    if (!response.ok) {
        console.log("Error Status:", response.status); // 👈 Agrega esto para ver si es 404, 500, etc.
        if(response.status === 401) throw new Error("Sesión expirada");
        throw new Error(`Error del servidor: ${response.status}`);
    }

    // 2. Recibir { Data: "..." }
    const resultadoDelServidor = await response.json(); 
    console.log("Sin desencriptar", resultadoDelServidor)

    // 3. Desencriptar la respuesta de SQL Server
    const dataLimpia = desencriptarDatos(resultadoDelServidor.data);
    console.log("Con encriptacion",dataLimpia)


    console.log("✅ Perfil recuperado de SQL Server:", dataLimpia);
    return dataLimpia; 

  } catch (error) {
    console.error("❌ Falló el flujo de perfil:", error.message);
    throw error;
  }
};