import * as schema from '@/db/schema';
import { actualizarPerfilApi, cancelarInscripcion, enviarDatosLogin, enviarDatosRegistro, enviarSugerenciaApi, gestionarSucursalesApi, inscribirAClase, obtenerClasesGimnasio, obtenerDatosPerfil, obtenerMisClases, sincronizarCreditosDesdeApi, sincronizarMembresiasDesdeApi } from '@/services/api';
import { limpiarDatosLocales } from '@/services/session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { eq, ne } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { router } from "expo-router";
import { useSQLiteContext } from 'expo-sqlite';
import { useContext, useMemo } from 'react';
import { UserContext } from "../components/UserContext";
import * as Crypto from 'expo-crypto';

//EL MAPA VA AQUÍ (AFUERA), sin 'export' si solo lo usas aquí, 
// o con 'export' si lo vas a importar en otro archivo.
export const MAPA_DISCIPLINAS: { [key: number]: string } = {
  1: 'Spinning', 2: 'Yoga', 3: 'Cardio', 4: 'Barre', 5: 'Zumba', 6: 'Zumba',
  7: 'Zumba', 8: 'Gimnasio', 9: 'Gimnasio', 1009: 'CrossFit', 1010: 'Cardio',
  1011: 'Cardio', 1012: 'Spinning', 1013: 'Pilates', 1014: 'Zumba', 2013: 'Ola',
  2014: 'Sdf', 3017: 'Spinning', 3018: 'Box', 3019: 'Spinning', 3020: 'Box', 4019: 'Capoeira'
};

export function useAuthService() {
  const db = useSQLiteContext();//Aqui ya se usa la base de datos para los queris
  const drizzleDb = useMemo(() => drizzle(db, { schema }), [db]);
  const { users, setUsers } = useContext(UserContext);

  // --- 1. REGISTRO MANUAL ---
const registrarUsuarioProceso = async (datosFormulario: any) => {
  try {
    // 1. Intentar registro en la API primero
    // Si la API falla (ej. correo duplicado), saltará directamente al catch
    const respuestaApi = await enviarDatosRegistro(datosFormulario);

    // 2. Si la API fue exitosa, procedemos a guardar en la base de datos local (SQLite)
    await drizzleDb.insert(schema.usersdb).values({
      nombres: datosFormulario.nombre,
      apellidoPaterno: datosFormulario.apellidoPaterno,
      apellidoMaterno: datosFormulario.apellidoMaterno,
      correo: datosFormulario.email,
      telefono: datosFormulario.telefono,
      contrasena: datosFormulario.password,
      estudiante: datosFormulario.estudiante,
      fechaNacimiento: datosFormulario.fechaNacimiento,
      gymId: datosFormulario.gymId,
      token: respuestaApi?.token || null, // Guardamos el token que nos dio el servidor
    });

    console.log("✅ Registro exitoso: Sincronizado con API y guardado en SQLite");
    
    // Retornamos la respuesta por si la pantalla necesita algún dato extra
    return respuestaApi;

  } catch (error: any) {
    // Extraemos el mensaje de error que viene del servidor o del sistema
    const mensajeError = error?.response?.data?.error || error.message || "";

    // Manejo de errores específicos para feedback del usuario
    if (mensajeError.includes("ya se encuentra registrado")) {
      alert("Error del servidor: El correo ya está registrado y activo.");
    } else if (mensajeError.includes("UNIQUE constraint failed")) {
      alert("Error local: Este usuario ya existe en la base de datos del teléfono.");
    } else if (mensajeError.includes("Network Error")) {
      alert("Error de conexión: Revisa tu internet.");
    } else {
      console.error("❌ Error crítico en el proceso de registro:", error);
      alert("Ocurrió un error inesperado al registrar.");
    }

    /* IMPORTANTE: Propagamos el error con 'throw'. 
       Esto hace que el 'try/catch' de tu pantalla (Registro.tsx) se active 
       y no ejecute el router.replace("/") ni limpie el formulario.
    */
    throw error; 
  }
};

// --- 2. LOGIN LOCAL ADAPTADO CON HASH SHA-256 ---
const loginUsuarioProceso = async (email: string, password: string, gymSelected: number) => {
  try {
    const respuestaApi = await enviarDatosLogin(email, password, gymSelected);

    if (respuestaApi && respuestaApi.Token) {
      
      // GENERAR HASH SHA-256 en Base64
      const passwordHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        password,
        { encoding: Crypto.CryptoEncoding.BASE64 }
      );

      // 1. LIMPIEZA TOTAL de la base de datos local
      await drizzleDb.delete(schema.usersdb);

      const rolUsuario = respuestaApi.Rol || "Cliente"; 

      // 2. INSERTAR en SQLite (Guardamos el HASH)
      await drizzleDb.insert(schema.usersdb).values({
        id: respuestaApi.Id, 
        token: respuestaApi.Token,
        correo: email,
        contrasena: passwordHash, // <--- AHORA SE GUARDA EL HASH EN BASE64
        nombres: respuestaApi.Nombres || "", 
        apellidoPaterno: respuestaApi.ApellidoPaterno || "",
        apellidoMaterno: respuestaApi.ApellidoMaterno || "",
        gymId: respuestaApi.GimnasioActual || gymSelected,
        rol: rolUsuario, 
        estudiante: "",
        fechaNacimiento: respuestaApi.FechaNacimiento || "",
        telefono: "", 
        deviceId: respuestaApi.DeviceId || "",
      });

      // 3. ACTUALIZAR ESTADO GLOBAL (Contexto)
      // Guardamos el hash en el contexto para que esté disponible en memoria
      setUsers({ 
        id: respuestaApi.Id,
        token: respuestaApi.Token,
        gymId: respuestaApi.GimnasioActual || gymSelected,
        nombres: respuestaApi.Nombres || "",
        correo: email,
        rol: rolUsuario,
        contrasena: passwordHash, // Opcional: puedes guardar 'password' (plana) si la ocupas luego
      }); 

      console.log(`✅ Sesión iniciada. Hash generado: ${passwordHash}`);
    }

    return respuestaApi;

  } catch (error) {
    console.error("Error en login local:", error);
    throw error;
  }
};

  // --- 3. PROCESO PARA GOOGLE (UPSERT) ---
  //Aqui el code es de forma nativa por incompativilidades en el desarrollo
 const guardarUsuarioEnSQLite = async (datos: { nombres: string, apellidoPaterno: string, apellidoMaterno: string, correo: string, token: string, superUsuario: number }) => {
  try {
    // 1. Verificación Crítica
    if (!db) {
       console.error("❌ La base de datos no está disponible en este render.");
       return;
    }

    console.log("💾 Intentando guardado nativo para:", datos.correo);

    // 2. Usar parámetros (?) en lugar de template strings para evitar errores de sintaxis
    // runAsync es más estable para INSERT que execAsync
    await db.runAsync(
      `INSERT INTO usersdb (nombres, apellidoPaterno, apellidoMaterno, correo, telefono, contrasena, token, gymId) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        datos.nombres || 'Google User',
        datos.apellidoPaterno || '',
        datos.apellidoMaterno || '',
        datos.correo || '',
        'S/N',
        'GOOGLE_LOGIN',
        datos.token,
        datos.superUsuario,
      ]
    );

    console.log("✅ ¡GUARDADO EXITOSO!");
    setUsers({ ...datos, telefono: "S/N", contrasena: "GOOGLE_LOGIN" });
    router.replace("/home");

  } catch (error: any) {
    if (error.message.includes("UNIQUE")) {
      console.log("🔄 El usuario ya existe, actualizando token...");
      try {
        await db.runAsync(
          `UPDATE usersdb SET token = ? WHERE correo = ?`,
          [datos.token, datos.correo]
        );
        console.log("✅ ¡TOKEN ACTUALIZADO!");
        router.replace("/home");
      } catch (updateError: any) {
        console.error("🛑 Error en el UPDATE:", updateError.message);
      }
    } else {
      console.error("🛑 Error persistente en SQLite:", error.message);
    }
  }
};

 // --- 4. Función para sincronizar la base de datos local Perfil---
const sincronizarPerfil = async (userId: number, correo: string, tokenForzado?: string) => {
  try {
    const datosApi = await obtenerDatosPerfil(tokenForzado);
    console.log("🔑 Datos obtenidos de la API:", datosApi); 

    if (!datosApi) throw new Error("No se recibieron datos del servidor");

    // --- 🛠️ LIMPIEZA DE FECHA FORZADA ---
    let fechaLimpia = datosApi.FechaNacimiento || "";
    
    if (fechaLimpia.includes('T')) {
        // De "1997-12-01T00:00:00" a ["1997", "12", "01"]
        const [y, m, d] = fechaLimpia.split('T')[0].split('-');
        fechaLimpia = `${d}/${m}/${y}`;
    } else if (fechaLimpia.includes('-')) {
        // De "1997-12-01" a ["1997", "12", "01"]
        const [y, m, d] = fechaLimpia.split('-');
        fechaLimpia = `${d}/${m}/${y}`;
    }
    // ---------------------------------------

    const tokenAFuardar = tokenForzado || await AsyncStorage.getItem('token');

    const filasActualizadas = await drizzleDb
      .update(schema.usersdb)
      .set({
        nombres: datosApi.Nombre || "",
        apellidoPaterno: datosApi.ApellidoPaterno || "",
        apellidoMaterno: datosApi.ApellidoMaterno || "",
        telefono: datosApi.Telefono || "",
        fechaNacimiento: fechaLimpia, // 👈 Guardamos el formato DD/MM/YYYY
        correo: datosApi.Correo || correo,
        token: tokenAFuardar 
      })
      .where(eq(schema.usersdb.id, userId))
      .returning();

    if (filasActualizadas.length > 0) {
        setUsers({
            ...filasActualizadas[0],
            id: Number(filasActualizadas[0].id)
        });
    }
    
    return datosApi;

  } catch (error) {
    console.error("❌ Error sincronización:", error);
    
    const dataLocal = await drizzleDb
      .select()
      .from(schema.usersdb)
      .where(eq(schema.usersdb.id, userId))
      .limit(1);
    
    if (dataLocal.length > 0) {
        setUsers(dataLocal[0]);
        return dataLocal[0];
    }
    return null;
  }
};

// Nueva función para obtener el usuario local sin errores de scope
//Uso en las Tablas MMEBRESIA Y CREDITOS

//MEMBRESIAS
  const obtenerUsuarioLocal = async () => {
    return await drizzleDb.select().from(schema.usersdb).get();
};

// --- 5. OBTENER MEMBRESÍAS (SOLO SQLITE) ---
const obtenerMembresiasLocal = async (usuarioId: number) => {
    try {
        const resultado = await drizzleDb
            .select()
            .from(schema.membresiasdb)
            .where(eq(schema.membresiasdb.userId, usuarioId));

        console.log("✅ Membresías recuperadas de SQLite:", resultado.length);
        return resultado;
    } catch (error) {
        console.error("❌ Error al leer de SQLite:", error);
        return [];
    }
};

// --- 5. PROCESAR Y GUARDAR (LLAMA AL API Y GUARDA EN SQLITE) ---
const actualizarBaseDatosLocalMembresia = async (usuarioId: number, gymId: number) => {
    try {
        // 1. Obtener datos nuevos del API primero
        const membresiasApi = await sincronizarMembresiasDesdeApi(usuarioId, gymId);
        
        // 2. LIMPIEZA: Borrar registros de OTROS usuarios 
        // Esto evita que la BD crezca con basura de sesiones viejas
        await drizzleDb.delete(schema.membresiasdb).where(ne(schema.membresiasdb.userId, usuarioId));
        
        // 3. REFRESCO: Borrar lo que este usuario ya tenía para evitar duplicados
        await drizzleDb.delete(schema.membresiasdb).where(eq(schema.membresiasdb.userId, usuarioId));

        // 4. INSERCIÓN
        if (membresiasApi && membresiasApi.length > 0) {
            const dataToInsert = membresiasApi.map((m: any) => ({
                folioMembresia: (m.FolioMembresia || m.folio || "").toString(),
                tipo: m.TipoMembresia || m.tipo || "Sin Tipo",
                fechaInicio: m.FechaInicio || m.fechaInicio || "",
                fechaFin: m.FechaExpiracion || m.fechaFin || "", 
                estatus: (m.Estatus === "Activo" || m.estatus === 1) ? 1 : 0,
                userId: usuarioId,
                gymId: gymId 
            }));

            await drizzleDb.insert(schema.membresiasdb).values(dataToInsert);
            console.log("✅ SQLite limpio y actualizado para el usuario:", usuarioId);
        }

        // 5. Mantenimiento del archivo físico (fuera de la lógica principal)
        // setTimeout(async () => {
        //     await drizzleDb.run(sql`PRAGMA wal_checkpoint(TRUNCATE);`);
        // }, 1000);

    } catch (error) {
        console.error("❌ Error en limpieza/actualización:", error);
    }
};

// --- 6. OBTENER CRÉDITOS DEL MÓVIL (LECTURA SQLITE) ---
const obtenerCreditosLocal = async (usuarioId: number) => {
    try {
        // Leemos de la tabla creditosdb filtrando por el dueño
        const resultado = await drizzleDb
            .select()
            .from(schema.creditosdb)
            .where(eq(schema.creditosdb.userId, usuarioId));
            
        console.log("✅ Créditos recuperados de SQLite:", resultado.length);
        return resultado;
    } catch (error) {
        console.error("❌ Error al obtener créditos locales:", error);
        return [];
    }
};

// --- 6. PROCESAR Y GUARDAR CRÉDITOS (API -> SQLITE) ---
const actualizarBaseDatosLocalCreditos = async (usuarioId: number, gymId: number) => {
    try {
        // 1. Sincronizar desde API
        const creditosApi = await sincronizarCreditosDesdeApi(usuarioId, gymId);
        console.log(`📡 API Créditos: Recibidos ${creditosApi?.length || 0} registros.`);

        // 2. LIMPIEZA ATÓMICA:
        // Primero: Borramos créditos de otros usuarios (los "fantasmas")
        await drizzleDb.delete(schema.creditosdb).where(ne(schema.creditosdb.userId, usuarioId));

        // Segundo: Borramos lo que este usuario ya tenía para refrescar con lo nuevo
        await drizzleDb.delete(schema.creditosdb).where(eq(schema.creditosdb.userId, usuarioId));

        if (creditosApi && creditosApi.length > 0) {
            // 3. Mapeo de inserción
            const dataToInsert = creditosApi.map((c: any) => ({
                folioCredito: (c.FolioCredito || c.folio || "").toString(),
                paquete: c.Paquete || c.paquete || "Paquete General",
                fechaPago: c.FechaPago || c.fechaPago || "",
                fechaExpiracion: c.FechaExpiracion || c.fechaVencimiento || "",
                estatus: (c.Estatus === "Activo" || c.estatus === 1) ? 1 : 0,
                userId: usuarioId,
                gymId: gymId 
            }));

            await drizzleDb.insert(schema.creditosdb).values(dataToInsert);
            console.log(`✅ Créditos actualizados en SQLite para Gym ${gymId}`);
        } else {
            console.warn(`⚠️ No hay créditos para el Gym ${gymId} en el servidor.`);
        }

        // 4. Mantenimiento físico (para que DB Browser vea los cambios real)
        // setTimeout(async () => {
        //     try {
        //         await drizzleDb.run(sql`PRAGMA wal_checkpoint(TRUNCATE);`);
        //         console.log("✅ Archivo físico de Créditos consolidado.");
        //     } catch (e) {
        //         // Si está ocupada, no pasa nada, se consolidará en la siguiente acción
        //     }
        // }, 800);

    } catch (error) {
        console.error("❌ Error al actualizar Créditos localmente:", error);  
    }
};


// --- 7. ACTUALIZAR CONTRASEÑA --- //
//Es solo para guardar en SQLite
const actualizarPassword = async (nuevoPassword: string, usuarioId: number ) => {
  try {
    // Usamos drizzleDb (el que creaste con useMemo)
    await drizzleDb
      .update(schema.usersdb) // Asegúrate que 'usuarios' sea el nombre en tu schema.ts
      .set({ 
        contrasena: nuevoPassword // El campo debe coincidir con tu tabla
      })
      .where(eq(schema.usersdb.id, usuarioId)); // Filtra por el ID del usuario logueado

    console.log("✅ Contraseña actualizada correctamente en SQLite");
  } catch (error) {
    console.error("❌ Error en update de password:", error);
  }
};

// --- Función para modificar perfil (API + SQLite + Contexto) ---
const sincronizarActualizacionPerfil = async (userId: number, nuevosDatos: any) => {
    try {
        // 1. Llamar al Service (Ya no le pasamos el token, él lo busca solo)
        const resultadoApi = await actualizarPerfilApi(nuevosDatos); 

        // 2. Usar el token que devolvió la API (o el que quedó en storage)
        const tokenFinal = resultadoApi.Token || await AsyncStorage.getItem('token');

        const filasActualizadas = await drizzleDb
            .update(schema.usersdb)
            .set({
                nombres: nuevosDatos.Nombre || "",
                apellidoPaterno: nuevosDatos.ApellidoPaterno || "",
                apellidoMaterno: nuevosDatos.ApellidoMaterno || "",
                correo: nuevosDatos.Correo || "",
                telefono: nuevosDatos.Telefono || "",
                fechaNacimiento: nuevosDatos.FechaNacimiento || "", // 👈 Agregado para persistir la fecha
                token: tokenFinal // 👈 Token renovado
            })
            .where(eq(schema.usersdb.id, userId))
            .returning();

        if (filasActualizadas.length > 0) {
            setUsers(filasActualizadas[0]); 
            console.log("✅ Perfil y Token sincronizados");
        }

        return { success: true, message: "Perfil actualizado" };
    } catch (error: any) {
        console.error("❌ Error en actualización:", error);
        throw error; 
    }
};

const actualizarGimnasioSeleccionado = async (gymId: any, userIdViejo: number, correo: string, password: string) => {
    try {
        const responseApi = await gestionarSucursalesApi(correo, password, gymId);

        // CORRECCIÓN: Se agregó el espacio para coincidir con el API
        if (responseApi.Accion === "Cambio Exitoso" && responseApi.NuevoToken) {
            
            const nuevoUserId = responseApi.Id; // El API manda 'Id'
            const nuevoToken = responseApi.NuevoToken;

            await AsyncStorage.setItem('token', nuevoToken);
            if (responseApi.RefreshToken) {
                await AsyncStorage.setItem('refreshToken', responseApi.RefreshToken);
            }

            // Limpieza de datos locales vinculados al ID anterior
            await drizzleDb.delete(schema.usersdb).where(eq(schema.usersdb.id, userIdViejo));
            await drizzleDb.delete(schema.creditosdb); 
            await drizzleDb.delete(schema.membresiasdb);

            // Inserción con mapeo de nombres de campos del API
            const filasNuevas = await drizzleDb.insert(schema.usersdb).values({
                id: nuevoUserId,
                gymId: responseApi.GimnasioActual || gymId, // Usamos la confirmación del server
                token: nuevoToken,
                correo: correo,
                contrasena: password,
                nombres: responseApi.Nombre || "Usuario", // Mapeo de 'Nombre' a 'nombres'
                apellidoPaterno: responseApi.ApellidoPaterno || "",
                apellidoMaterno: responseApi.ApellidoMaterno || "",
                telefono: responseApi.Telefono || ""
            }).returning();

            if (filasNuevas.length > 0) {
                const usuarioParaContexto = {
                    ...filasNuevas[0],
                    id: Number(filasNuevas[0].id)
                };
                
                setUsers(usuarioParaContexto);
                
                // Sincronizamos con el nuevo ID y Token
                await sincronizarPerfil(Number(nuevoUserId), correo, nuevoToken);
            }
            
            return responseApi; 
        }
        return responseApi;
    } catch (error) {
        console.error("❌ Error en el proceso:", error);
        throw error;
    }
};

const enviarSugerenciaService = async (comentario: string, calificacion: number, gymId: number | string) => {
    try {
        // Validamos que existan ambos datos
        if (!comentario || comentario.trim().length < 5) {
            throw new Error("El comentario es demasiado corto.");
        }
        
        if (calificacion < 1 || calificacion > 5) {
            throw new Error("La calificación debe estar entre 1 y 5.");
        }

        // Enviamos los tres datos a la API
        const respuesta = await enviarSugerenciaApi(comentario, calificacion, gymId);

        // Retornamos la respuesta descifrada
        return respuesta;
    } catch (error: any) {
        console.error("❌ Error en SugerenciaService:", error.message);
        throw error;
    }
};

// AGREGA usuarioId COMO PARÁMETRO
  // Esto soluciona el error "Cannot find name 'usuarioIdActual'"
  const sincronizarClasesGimnasio = async (gimnasioId: number, usuarioId: number) => {
  try {
    // 1. Llamada a la API (Obtenemos la lista general)
    const data = await obtenerClasesGimnasio(gimnasioId);
    
    // 2. Llamada a tus inscripciones para saber exactamente qué lugar tienes
    const misInscripciones = await obtenerMisClases(usuarioId, gimnasioId);
    
    if (Array.isArray(data)) {
      await drizzleDb.delete(schema.reservacionesdb);

      for (const item of data) {
        // Buscamos si esta clase específica está en mis inscripciones
        const miReserva = Array.isArray(misInscripciones) 
          ? misInscripciones.find((ins: any) => Number(ins.clase_ID) === Number(item.id))
          : null;

        const estaEnEsperaLista = (item.esperaUsers || []).some((id: any) => Number(id) === usuarioId);
        
        // Mapeo de nombre según tu MAPA_DISCIPLINAS
        const idDisciplina = Number(item.tipoClase_ID);
        const nombreReal = MAPA_DISCIPLINAS[idDisciplina] || item.nombre || 'Clase';

        // --- CORRECCIÓN AQUÍ ---
        // Priorizamos 'miLugar' de la respuesta principal, luego lo que diga 'misInscripciones'
        const lugarFinal = item.miLugar || (miReserva ? miReserva.lugar : 0);

        await drizzleDb.insert(schema.reservacionesdb).values({
          id: Number(item.id),
          claseId: Number(item.claseId || item.id),
          nombreClase: nombreReal,
          // Revisa si en tu esquema es 'horaInicio' u 'horaIncio' para que coincida
          horaInicio: item.horaIncio || item.horaInicio || '00:00', 
          horaFin: item.horaFin || '00:00',
          coach: item.asistenciaCoach || "Staff",
          fecha: item.fecha ? item.fecha.split('T')[0] : '',
          vacantes: Number(item.vacantes) || 0,
          tipoClaseID: idDisciplina,

          lugaresOcupados: JSON.stringify(item.lugaresOcupados || []),
          esperaUsers: JSON.stringify(item.esperaUsers || []),

          // Determinamos el estado basado en el lugar final
          estado: (miReserva || estaEnEsperaLista) 
            ? (lugarFinal == 0 || estaEnEsperaLista ? "ESPERA" : "INSCRITO") 
            : "DISPONIBLE",
            
          // --- CORRECCIÓN AQUÍ ---
          // Guardamos el lugar que calculamos arriba, no solo el de miReserva
          lugar: Number(lugarFinal), 
        });
      }
    }
    
    return await drizzleDb.select()
      .from(schema.reservacionesdb)
      .orderBy(schema.reservacionesdb.horaInicio);

  } catch (error) {
    console.error("Error en sincronización:", error);
    return await drizzleDb.select().from(schema.reservacionesdb);
  }
};

const obtenerMisClasesProceso = async (usuarioId: number, gimnasioId: number) => {
  try {
    // Retornamos lo que el componente espera para unificar con las clases disponibles
    const locales = await drizzleDb.select().from(schema.reservacionesdb);
    // Filtramos solo donde el usuario tenga un lugar o esté en espera
    return locales.filter(c => c.estado === 'INSCRITO' || c.estado === 'ESPERA');
  } catch (error) {
    return [];
  }
};

const inscribirAClaseProceso = async (claseId: any, lugar: any, usuarioId: any) => {
  try {
    const response = await inscribirAClase(claseId, lugar);
    // Después de inscribir, lo ideal es resincronizar todo para tener los arrays actualizados
    return response;
  } catch (error) {
    throw error;
  }
};

const cancelarInscripcionProceso = async (idClase: string | number) => {
  try {
    await cancelarInscripcion(idClase);
    // Al cancelar, lo marcamos como disponible localmente de inmediato
    await drizzleDb.update(schema.reservacionesdb)
      .set({ estado: 'DISPONIBLE', lugar: 0 })
      .where(eq(schema.reservacionesdb.id, Number(idClase)));
  } catch (error) {
    throw error;
  }
};

const verificarSesionLocal = async () => {
  try {
    const usuariosLocales = await drizzleDb.select().from(schema.usersdb).limit(1);
    if (usuariosLocales.length > 0) {
      return usuariosLocales[0];
    }
    return null;
  } catch (error) {
    console.error("Error al leer SQLite:", error);
    return null;
  }
};

const cerrarSesionProceso = async () => {
  try {
    // 1. Ejecutamos la limpieza profunda (Backend, FileSystem y AsyncStorage)
    // Como ya tiene el fetch con .catch(), manejará el internet automáticamente.
    await limpiarDatosLocales();

    // 2. Limpieza de las tablas mediante Drizzle (opcional si borras el archivo, pero buena práctica)
    await drizzleDb.delete(schema.usersdb);
    
    // 3. Limpiamos el estado global del contexto para que el Layout reaccione
    setUsers(null);
    
    console.log("Log: Sesión limpiada por completo mediante limpiarDatosLocales");
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    // Fallback: Si algo falla, aseguramos que el estado sea null para sacar al usuario
    setUsers(null);
  }
};

  return { registrarUsuarioProceso, loginUsuarioProceso, guardarUsuarioEnSQLite, sincronizarPerfil,sincronizarActualizacionPerfil, actualizarGimnasioSeleccionado, obtenerUsuarioLocal, obtenerMembresiasLocal, obtenerCreditosLocal, 
  actualizarBaseDatosLocalMembresia, actualizarBaseDatosLocalCreditos, actualizarPassword, enviarSugerenciaService,sincronizarClasesGimnasio, inscribirAClaseProceso, cancelarInscripcionProceso, obtenerMisClasesProceso, 
  verificarSesionLocal, cerrarSesionProceso};
}
