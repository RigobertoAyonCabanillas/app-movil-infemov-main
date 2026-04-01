import CryptoJS from 'crypto-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.0.106:5254/api';
const API_URL2 = 'http://192.168.0.137:5254/api';

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
      body: JSON.stringify({ Data: datosParaEnviar }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error en el servidor: ${errorText}`);
    }

    const result = await response.json();
    // Desencriptamos la respuesta del registro (asumiendo que viene igual que login)
    const dataDesencriptada = desencriptarDatos(result.data || result.Data);

    // --- NUEVO: GUARDAR TOKENS TRAS REGISTRO ---
    if (dataDesencriptada.Token && dataDesencriptada.RefreshToken) {
        await AsyncStorage.setItem('token', dataDesencriptada.Token);
        await AsyncStorage.setItem('refreshToken', dataDesencriptada.RefreshToken);
        await AsyncStorage.setItem('usuarioId', dataDesencriptada.Id.toString());
    }

    console.log("✅ Registro exitoso y tokens guardados");
    return dataDesencriptada;

  } catch (error) {
    console.error("❌ Error al cifrar o enviar registro:", error);
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
        throw new Error(`Error: ${response.status}`);
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
      body: JSON.stringify({ Data: datosParaEnviar }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
    }

    const result = await response.json();
    const dataDesencriptada = desencriptarDatos(result.data || result.Data);

    // --- NUEVO: GUARDAR TOKENS ---
    if (dataDesencriptada.Token && dataDesencriptada.RefreshToken) {
        await AsyncStorage.setItem('token', dataDesencriptada.Token);
        await AsyncStorage.setItem('refreshToken', dataDesencriptada.RefreshToken);
        await AsyncStorage.setItem('usuarioId', dataDesencriptada.Id.toString());
    }

    console.log("✅ Login exitoso y tokens guardados");
    return dataDesencriptada; 

  } catch (error) {
    console.error("❌ Error en login:", error);
    throw error;
  }
};

// Consulta de información de perfil
export const obtenerDatosPerfil = async (tokenForzado) => {
  try {
    // Si pasamos tokenForzado, fetchSeguro lo usará en lugar del de Julian
    const response = await fetchSeguro('/profile', { 
      method: 'GET',
      headers: tokenForzado ? { 'Authorization': `Bearer ${tokenForzado}` } : {} 
    });

    if (!response.ok) throw new Error(`Error: ${response.status}`);

    const resultado = await response.json();
    return desencriptarDatos(resultado.data || resultado.Data);
  } catch (error) {
    console.error("❌ Falló el perfil:", error.message);
    throw error;
  }
};

// Tabla de Membresias - Adaptada con Token y Filtros
// --- MEMBRESÍAS ---
export const sincronizarMembresiasDesdeApi = async (usuarioId, gymId) => {
    try {
        // Usamos la ruta relativa, fetchSeguro le pone el API_URL y el Token
        const response = await fetchSeguro(`/mis-membresias/${usuarioId}/${gymId}`);
        
        if (!response.ok) throw new Error(`Error: ${response.status}`);

        const result = await response.json();
        const datosClaros = desencriptarDatos(result.data || result.Data);

        console.log("DD", datosClaros)

        const objetoData = (typeof datosClaros === 'string') ? JSON.parse(datosClaros) : datosClaros;

        return objetoData.Membresias || [];
    } catch (error) {
        console.error("❌ Error en Membresías:", error);
        throw error;
    }
};

// Tabla de Creditos - Adaptada con Token y Filtros
// --- CRÉDITOS ---
export const sincronizarCreditosDesdeApi = async (usuarioId, gymId) => {
    try {
        const response = await fetchSeguro(`/mis-creditos/${usuarioId}/${gymId}`);
        
        if (!response.ok) throw new Error(`Error: ${response.status}`);

        const result = await response.json();
        const datosClaros = desencriptarDatos(result.data || result.Data);
        const objetoData = (typeof datosClaros === 'string') ? JSON.parse(datosClaros) : datosClaros;

        console.log("DDC", datosClaros)
        return objetoData.Creditos || [];
    } catch (error) {
        console.error("❌ Error en Créditos:", error);
        throw error;
    }
};

// Actualización de Perfil con cifrado AES-ECB
// En tu archivo de servicios donde esté actualizarPerfilApi
export const actualizarPerfilApi = async (datos) => {
  try {
    const jsonString = JSON.stringify(datos);
    const key = CryptoJS.enc.Utf8.parse(SECRET_KEY);
    const cifrado = CryptoJS.AES.encrypt(jsonString, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    }).toString();

    // fetchSeguro se encarga del 401 automáticamente
    const response = await fetchSeguro('/actualizar-perfil', {
      method: 'PUT',
      body: JSON.stringify({ Data: cifrado }),
    });

    const resultadoJson = await response.json();
    return desencriptarDatos(resultadoJson.Data || resultadoJson.data);
  } catch (error) {
    console.error("❌ Error en actualización:", error.message);
    throw error;
  }
};

// Actualizar Contraseña en el Servidor
export const actualizarPasswordApi = async (passwordActual, nuevaPassword, token) => {
  try {
    const datos = {
      PasswordActual: passwordActual,
      NuevaPassword: nuevaPassword
    };

    const jsonString = JSON.stringify(datos);
    const key = CryptoJS.enc.Utf8.parse(SECRET_KEY);

    const cifrado = CryptoJS.AES.encrypt(jsonString, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    });

    const response = await fetch(`${API_URL}/actualizar-password`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ Data: cifrado.toString() }),
    });

    // 1. Obtener el texto plano primero para evitar errores de parseo
    const rawText = await response.text();
    
    // 2. Intentar convertir a JSON solo si hay contenido
    let resultadoJson = {};
    if (rawText) {
      try {
        resultadoJson = JSON.parse(rawText);
      } catch (e) {
        throw new Error("La respuesta del servidor no es un JSON válido.");
      }
    }

    // 3. Validar si la respuesta HTTP fue exitosa
    if (!response.ok) {
        // Si el servidor mandó un error cifrado o un mensaje de error directo
        const mensajeError = resultadoJson.Error || resultadoJson.Message || "Error al cambiar la contraseña";
        throw new Error(mensajeError);
    }

    // 4. Descifrar la respuesta (Solo si el servidor responde con Data cifrada)
    const payloadCifrado = resultadoJson.Data || resultadoJson.data;
    
    if (!payloadCifrado) {
        return resultadoJson; // Retornar tal cual si no viene cifrado (ej. un mensaje de éxito directo)
    }

    return desencriptarDatos(payloadCifrado);

  } catch (error) {
    console.error("❌ Error en actualizarPasswordApi:", error.message);
    throw error;
  }
};

// --- FUNCION GESTIONAR SUCURSALES (ADAPTADA AL FETCH SEGURO) ---
export const gestionarSucursalesApi = async (correo, password = "", superUsuarioId = null) => {
  try {
    // 1. Preparar el objeto para el C#
    const datosRequest = {
      Correo: correo?.trim(),
      Password: password || "", 
      SuperUsuarioId: superUsuarioId ? Number(superUsuarioId) : null
    };

    console.log("🔐 Enviando GESTIÓN SUCURSAL:", datosRequest);

    const jsonString = JSON.stringify(datosRequest);
    const key = CryptoJS.enc.Utf8.parse(SECRET_KEY);

    // 2. Cifrar (AES-ECB-Pkcs7)
    const cifrado = CryptoJS.AES.encrypt(jsonString, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    }).toString();

    // 3. Petición usando fetchSeguro (Maneja Token, Refresh y Errores 401)
    const response = await fetchSeguro(`/gestionar-sucursales`, {
      method: 'POST',
      body: JSON.stringify({ Data: cifrado }),
    });

    // 4. Manejo de respuesta
    const text = await response.text(); 
    
    if (!text) {
      throw new Error("El servidor no devolvió contenido.");
    }

    let resultadoJson;
    try {
      resultadoJson = JSON.parse(text);
    } catch (e) {
      throw new Error("La respuesta del servidor no es un formato válido.");
    }

    if (!response.ok) {
      throw new Error(resultadoJson.Error || resultadoJson.error || "Error en el servidor");
    }

    // 5. Descifrar respuesta
    const payloadCifrado = resultadoJson.Data || resultadoJson.data;
    
    if (!payloadCifrado) {
       throw new Error("No se recibió la información cifrada.");
    }

    const jsonDescifrado = desencriptarDatos(payloadCifrado);
    
    const resultadoFinal = typeof jsonDescifrado === 'string' 
      ? JSON.parse(jsonDescifrado) 
      : jsonDescifrado;

    // IMPORTANTE: Si el cambio de sucursal devuelve un nuevo Token/Refresh, actualizarlos
    if (resultadoFinal.Token && resultadoFinal.RefreshToken) {
        await AsyncStorage.setItem('token', resultadoFinal.Token);
        await AsyncStorage.setItem('refreshToken', resultadoFinal.RefreshToken);
    }

    return resultadoFinal;

  } catch (error) {
    console.error("❌ Error en gestionarSucursalesApi:", error.message);
    throw error;
  }
};

//Renovacion del token para la sesion
export const renovarToken = async () => {
    try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        const usuarioId = await AsyncStorage.getItem('usuarioId');

        if (!refreshToken || !usuarioId) throw new Error("No hay datos para renovar sesión");

        // Preparamos el cuerpo que espera el backend (UsuarioId y RefreshToken)
        const datos = {
            RefreshToken: refreshToken,
            UsuarioId: parseInt(usuarioId)
        };

        // Ciframos los datos igual que en Login
        const jsonString = JSON.stringify(datos);
        const key = CryptoJS.enc.Utf8.parse(SECRET_KEY);
        const cifrado = CryptoJS.AES.encrypt(jsonString, key, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        });

        const response = await fetch(`${API_URL}/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Data: cifrado.toString() })
        });


        if (!response.ok) throw new Error('Sesión expirada permanentemente');

        const result = await response.json();
        const nuevosDatos = desencriptarDatos(result.data || result.Data);

        // Guardamos los NUEVOS tokens (el refresh también suele cambiar por seguridad)
        await AsyncStorage.setItem('token', nuevosDatos.Token);
        await AsyncStorage.setItem('refreshToken', nuevosDatos.RefreshToken);

        console.log("🔄 Token renovado automáticamente");
        return nuevosDatos.Token;
    } catch (error) {
        console.error("❌ Error al renovar token:", error);
        throw error;
    }
};

//Para volver a pedir el token refrescado en caso de 401 para los servicios
//Fucion principal ligada a "renovarToken"
export const fetchSeguro = async (endpoint, opciones = {}) => {
  // 1. Extraer el token de los headers de opciones si existe (token forzado)
  // Si no viene en opciones.headers, entonces lo buscamos en AsyncStorage
  let token = opciones.headers?.['Authorization']?.replace('Bearer ', '') 
              || await AsyncStorage.getItem('token');

  // 2. Preparamos los headers base
  const headersBase = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...opciones.headers, // Esto permite que el token forzado gane la partida
  };

  // 2. Primer intento
  let response = await fetch(`${API_URL}${endpoint}`, {
    ...opciones,
    headers: headersBase,
  });

  // 3. ¿El token expiró? (401)
  if (response.status === 401) {
    console.log("🔑 Token expirado. Intentando renovar con RefreshToken...");

    try {
      // 4. Intentamos obtener el nuevo Token
      const nuevoToken = await renovarToken();

      if (nuevoToken) {
        // 5. CRÍTICO: Reconstruimos la petición con el NUEVO TOKEN
        // No reutilizamos el objeto anterior para evitar problemas de referencia
        response = await fetch(`${API_URL}${endpoint}`, {
          ...opciones,
          headers: {
            ...headersBase,
            'Authorization': `Bearer ${nuevoToken}`,
          },
        });

        console.log("✅ Petición reintentada con éxito tras refresh");
      }
    } catch (error) {
      console.error("🚨 El RefreshToken también falló. Sesión muerta.");
      throw new Error("SESION_EXPIRADA");
    }
  }

  return response;
};


//Sugerencias-Comentarios
// Enviar Sugerencia con Comentario y Calificación
export const enviarSugerenciaApi = async (comentario, calificacion, gymId) => {
  try {
    // 1. Incluimos la Calificación en el objeto antes de cifrar
    const datos = {
      Comentario: comentario,
      Calificacion: calificacion, // Se envía como número (1-5)
      SuperUsuarioId: gymId,
      Fecha: new Date().toISOString()
    };

    const jsonString = JSON.stringify(datos);
    const key = CryptoJS.enc.Utf8.parse(SECRET_KEY);

    // 2. Cifrado AES-ECB
    const cifrado = CryptoJS.AES.encrypt(jsonString, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    }).toString();

    // 3. Petición POST (Asegúrate de que la ruta coincida con tu Controller)
    const response = await fetchSeguro('/sugerencias', { 
      method: 'POST',
      body: JSON.stringify({ Data: cifrado }),
    });

    // 4. Verificamos si la respuesta es exitosa
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error del servidor (${response.status}): ${errorText}`);
    }

    const resultadoJson = await response.json();
    
    // 5. Desencriptar la respuesta del servidor
    if (resultadoJson && (resultadoJson.Data || resultadoJson.data)) {
        return desencriptarDatos(resultadoJson.Data || resultadoJson.data);
    }
    
    return resultadoJson;
  } catch (error) {
    console.error("❌ Error enviando sugerencia:", error.message);
    throw error;
  }
};

// ─── 1. OBTENER CLASES DEL GIMNASIO ───────────────────────────────
export const obtenerClasesGimnasio = async (superUsuarioId) => {
  try {
    const response = await fetchSeguro(`/Gimnasio/${superUsuarioId}`, {
      method: 'GET',
    });

    const data = await response.json();
    console.log("Gimnasssios: ", data)
    if (!response.ok) throw new Error(data.mensaje || 'Error al obtener clases');
    
    return data; 
  } catch (error) {
    console.error("Error en obtenerClasesGimnasio:", error.message);
    throw error;
  }
};

// ─── 2. OBTENER MIS CLASES INSCRITAS ──────────────────────────────
// api.js
export const obtenerMisClases = async (usuarioId, superUsuarioId) => {
  try {
    // La URL debe coincidir con: [HttpGet("MisClases/{usuarioId}/{superUsuarioId}")]
    const response = await fetchSeguro(`/MisClases/${usuarioId}/${superUsuarioId}`, {
      method: 'GET',
    });

    const data = await response.json();
    console.log("datos inscritoss", data)

    if (!response.ok) {
      throw new Error(data.mensaje || 'Error al obtener tus clases');
    }

    console.log("Inscripciones recuperadas:", data); // Aquí verás la lista de la imagen SQL
    return data;
  } catch (error) {
    console.error("Error en obtenerMisClases:", error.message);
    throw error;
  }
};

// ─── 3. INSCRIBIRSE A UNA CLASE ───────────────────────────────
/// Agregamos equipoId como parámetro (puedes pasarle null si no manejas equipos aún)
export const inscribirAClase = async (claseId, equipoId = null) => {
    try {
        const response = await fetchSeguro('/InscribirseClase', {
            method: 'POST',
            // El backend ahora espera ClaseId y EquipoId (con mayúsculas o minúsculas según tu JSON serializer)
            body: JSON.stringify({
                claseId: claseId,
                equipoId: equipoId 
            }),
        });

        const textData = await response.text();
        let data = {};

        try {
            data = textData ? JSON.parse(textData) : {};
        } catch (e) {
            if (!response.ok) {
                console.log("Error no-JSON del servidor:", textData);
                throw new Error("Error en la respuesta del servidor");
            }
        }

        // Manejo de errores específicos que definiste en el C#
        if (!response.ok) {
            // Aquí capturamos los mensajes como "sincreditos", "sinmembresia", etc.
            const errorMsg = data.mensaje || 'Error al inscribirse xd';
            throw new Error(errorMsg);
        }

        return data;
    } catch (error) {
        console.error("Error en inscribirAClase:", error.message);
        throw error;
    }
};