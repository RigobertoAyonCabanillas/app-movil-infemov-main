import CryptoJS from 'crypto-js';

const API_URL = 'http://100.116.49.102:5254/api/auth';
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
// Adaptación del servicio para incluir el SuperUsuarioId
export const enviarDatosLogin = async (correo, contrasena, gymId) => {
  try {
    // 1. Preparamos el objeto con las credenciales EXACTAS que pide el backend
    // C# espera: Correo, Password y SuperUsuarioId
    const datos = {
      Correo: correo,
      Password: contrasena,
      SuperUsuarioId: gymId // <--- Nuevo campo obligatorio
    };

    const jsonString = JSON.stringify(datos);

    // 2. Ciframos usando la configuración (ECB / Pkcs7)
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
        const errorData = await response.json();
        // Si el backend envía un mensaje de error específico, lo lanzamos
        throw new Error(errorData.error || `Error: ${response.status}`);
    }

    const dataCifrada = await response.json();
    
    // 4. Desencriptar la respuesta
    // El backend devuelve: { Data: "cadena_cifrada" }
    const dataDesencriptada = desencriptarDatos(dataCifrada.data);

    console.log("✅ Login exitoso y data desencriptada");
    console.log("Datos Login: ", dataDesencriptada);

    // Esto ahora contendrá: { Token, Id, Correo, GimnasioActual }
    return dataDesencriptada; 

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

// Tabla de Membresias - Adaptada para filtrar por Usuario y Gimnasio
export const sincronizarMembresiasDesdeApi = async (usuarioId, gymId) => {
    try {
        // 1. La URL ahora requiere ambos parámetros: /mis-membresias/{usuarioId}/{superUsuarioId}
        const response = await fetch(`${API_URL}/mis-membresias/${usuarioId}/${gymId}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.Error || `Error del servidor: ${response.status}`);
        }

        const result = await response.json();

        // 2. El backend devuelve { Data: "cadena_cifrada" }
        if (result.data || result.Data) {
            const datosClaros = desencriptarDatos(result.data);
            
          const objetoData = (typeof datosClaros === 'string') 
              ? JSON.parse(datosClaros) 
              : datosClaros;

          let listaFinal = [];

          // VALIDACIÓN CRUCIAL:
          if (objetoData.Membresias) {
              if (typeof objetoData.Membresias === 'string') {
                  // Si el backend mandó el array como un string (lo que se ve en tu log)
                  listaFinal = JSON.parse(objetoData.Membresias);
              } else {
                  // Si ya es un array normal
                  listaFinal = objetoData.Membresias;
              }
          }
        console.log(`✅ Membresias procesadas correctamente:`, listaFinal.length);
        return listaFinal;
    } 
        } catch (error) {
            console.error("❌ Error en sincronizarMembresiasDesdeApi:", error);
            throw error;
        }
      
};

// Tabla de Creditos - Actualizada con gymId y manejo de encriptación
export const sincronizarCreditosDesdeApi = async (usuarioId, gymId) => {
    try {
        // 1. Agregamos el gymId a la URL como pide el nuevo endpoint [HttpGet("mis-creditos/{usuarioId}/{superUsuarioId}")]
        const response = await fetch(`${API_URL}/mis-creditos/${usuarioId}/${gymId}`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.Error || `Error del servidor: ${response.status}`);
        }

        const result = await response.json();

        // 2. Manejo de datos (Cifrados o Planos)
        // Si viene 'data' o 'Data', significa que la encriptación está activa
        if (result.data || result.Data) {
            const rawData = result.data || result.Data;
            const datosClaros = desencriptarDatos(rawData);

            

            const objetoData = (typeof datosClaros === 'string') 
                ? JSON.parse(datosClaros) 
                : datosClaros;

            let listaCreditos = [];

            // 3. Validación de contenido (Maneja si el backend envía el array como string o objeto)
            if (objetoData.Creditos) {
                listaCreditos = (typeof objetoData.Creditos === 'string')
                    ? JSON.parse(objetoData.Creditos)
                    : objetoData.Creditos;
            }

            console.log("✅ Créditos listos (Cifrados):", listaCreditos.length);
            return listaCreditos;
        } 
        
        // 4. Si NO viene 'Data', pero sí 'Creditos' directamente (como lo tienes ahorita para Postman)
        if (result.Creditos) {
            console.log("✅ Créditos listos (Texto Plano):", result.Creditos.length);
            return result.Creditos;
        }

        return [];

    } catch (error) {
        console.error("❌ Error en fetch API Créditos:", error);
        throw error;
    }
};