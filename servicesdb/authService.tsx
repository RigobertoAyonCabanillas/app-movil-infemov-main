import { useMemo, useContext } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '@/db/schema';
import { actualizarPerfilApi, cancelarInscripcion, desencriptarDatos, enviarDatosLogin, enviarDatosRegistro, enviarSugerenciaApi, gestionarSucursalesApi, inscribirAClase, obtenerClasesGimnasio, obtenerDatosPerfil, obtenerMisClases, sincronizarCreditosDesdeApi, sincronizarMembresiasDesdeApi } from '@/services/api'; 
import { router } from "expo-router";
import { eq, and, sql } from 'drizzle-orm'; 
import { UserContext } from "../components/UserContext"; 
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      await drizzleDb.insert(schema.usersdb).values({
        //id: datosFormulario.email, // Usamos el email como ID temporal para que no sea nulo
        nombres: datosFormulario.nombre,
        apellidoPaterno: datosFormulario.apellidoPaterno,
        apellidoMaterno: datosFormulario.apellidoMaterno,
        correo: datosFormulario.email,
        telefono: datosFormulario.telefono,
        contrasena: datosFormulario.password,
        estudiante: datosFormulario.estudiante,
        fechaNacimiento: datosFormulario.fechaNacimiento,
        gymId: datosFormulario.gymId, // superUsuario
        token: null, 
      });

      console.log("✅ Guardado en SQLite con éxito");
      try {
        await enviarDatosRegistro(datosFormulario);
      } catch (apiError) {
        console.warn("⚠️ Falló API, pero el dato está seguro en el móvil:", apiError);
      }

      alert("¡Registro exitoso!");
      router.replace("/");
    } catch (dbError: any) {
      if (dbError.message.includes("UNIQUE constraint failed")) {
        alert("Error: Este correo electrónico ya está registrado.");
      } else {
        console.error("❌ Error de DB:", dbError);
      }
    }
  };

// --- 2. LOGIN LOCAL ADAPTADO PARA ROLES ---
const loginUsuarioProceso = async (email: string, password: string, gymSelected: number) => {
  try {
    const respuestaApi = await enviarDatosLogin(email, password, gymSelected);

    if (respuestaApi && respuestaApi.Token) {
      // 1. LIMPIEZA TOTAL
      await drizzleDb.delete(schema.usersdb);

      // Extraemos el Rol directamente de la respuesta (según tu log: 'Cliente' o 'Coach')
      const rolUsuario = respuestaApi.Rol || "Cliente"; 

      // 2. INSERTAR en SQLite (Asegúrate de tener la columna 'rol' en tu schema)
      await drizzleDb.insert(schema.usersdb).values({
        id: respuestaApi.Id, 
        token: respuestaApi.Token,
        correo: email,
        contrasena: password,
        nombres: respuestaApi.Nombres || "", 
        apellidoPaterno: respuestaApi.ApellidoPaterno || "",
        apellidoMaterno: respuestaApi.ApellidoMaterno || "",
        gymId: respuestaApi.GimnasioActual || gymSelected,
        // AGREGAMOS EL ROL AQUÍ
        rol: rolUsuario, 
        estudiante: "",
        fechaNacimiento: "",
        telefono: "", 
        deviceId: respuestaApi.DeviceId || "",
      });

      // 3. ACTUALIZAR ESTADO GLOBAL (Contexto)
      // Agregamos el rol para que las pantallas como 'reservaciones.tsx' cambien su lógica
      setUsers({ 
        id: respuestaApi.Id,
        token: respuestaApi.Token,
        gymId: respuestaApi.GimnasioActual || gymSelected,
        nombres: respuestaApi.Nombres || "",
        correo: email,
        rol: rolUsuario // <-- Ahora el contexto sabe quién es quién
      }); 

      console.log(`✅ Sesión iniciada: ID ${respuestaApi.Id} | Rol: ${rolUsuario}`);
    }

    return respuestaApi;

  } catch (error) {
    console.error("Error en login local:", error);
    alert("No se pudo iniciar sesión.");
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
    // 1. Pedir a la API 
    // PASAMOS el token forzado si existe, para que la API sepa quién es el nuevo usuario
    const datosApi = await obtenerDatosPerfil(tokenForzado); 

    if (!datosApi) throw new Error("No se recibieron datos del servidor");

    // 2. Determinar qué token guardar en SQLite
    // Si venimos de un cambio de gym, usamos el forzado. Si no, el del storage.
    const tokenAFuardar = tokenForzado || await AsyncStorage.getItem('token');

    // 3. Guardar en SQLite
    const filasActualizadas = await drizzleDb
      .update(schema.usersdb)
      .set({
        nombres: datosApi.Nombre || "",
        apellidoPaterno: datosApi.ApellidoPaterno || "",
        apellidoMaterno: datosApi.ApellidoMaterno || "",
        telefono: datosApi.Telefono || "",
        correo: datosApi.Correo || correo,
        token: tokenAFuardar 
      })
      .where(eq(schema.usersdb.id, userId))
      .returning();

    // 4. Actualizar Contexto
    if (filasActualizadas.length > 0) {
        // Asegúrate de que el ID sea Number para evitar desajustes en el context
        setUsers({
            ...filasActualizadas[0],
            id: Number(filasActualizadas[0].id)
        });
    }
    
    return datosApi;

  } catch (error) {
    console.error("❌ Error sincronización:", error);
    
    // Si falla (por falta de red), recuperamos lo que ya hay en SQLite
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
        const membresiasApi = await sincronizarMembresiasDesdeApi(usuarioId, gymId);
        
        // Log para ver qué está llegando realmente
        console.log(`📡 Datos recibidos del Gym ${gymId}:`, membresiasApi?.length || 0);

        // 1. Borramos solo lo de este usuario (Limpieza total antes de refrescar)
        await drizzleDb.delete(schema.membresiasdb).where(eq(schema.membresiasdb.userId, usuarioId));

        if (membresiasApi && membresiasApi.length > 0) {
            const dataToInsert = membresiasApi.map((m: any) => ({
                folioMembresia: (m.FolioMembresia || m.folio || "").toString(),
                tipo: m.TipoMembresia || m.tipo || "Sin Tipo",
                fechaInicio: m.FechaInicio || m.fechaInicio || "",
                fechaFin: m.FechaExpiracion || m.fechaFin || "", 
                estatus: (m.Estatus === "Activo" || m.estatus === 1) ? 1 : 0,
                userId: usuarioId,
                gymId: gymId // <--- AHORA SÍ SE GUARDA EL GYM
            }));

            await drizzleDb.insert(schema.membresiasdb).values(dataToInsert);
            console.log("✅ Membresías guardadas en SQLite");
        }
    } catch (error) {
        console.error("❌ Error en actualización local:", error);
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
        // 2. Sincronizar desde API (ya no necesita token aquí, fetchSeguro lo hace)
        const creditosApi = await sincronizarCreditosDesdeApi(usuarioId, gymId);

        console.log(`📡 API Créditos: Recibidos ${creditosApi?.length || 0} registros.`);

        // 3. Limpiar créditos viejos del usuario en la DB local
        await drizzleDb.delete(schema.creditosdb).where(eq(schema.creditosdb.userId, usuarioId));

        if (creditosApi && creditosApi.length > 0) {
            // 4. Usamos un mapeo para insertar todo de golpe (más eficiente)
            const dataToInsert = creditosApi.map((c: any) => ({
                folioCredito: (c.FolioCredito || c.folio || "").toString(),
                paquete: c.Paquete || c.paquete || "Paquete General",
                fechaPago: c.FechaPago || c.fechaPago || "",
                fechaExpiracion: c.FechaExpiracion || c.fechaVencimiento || "",
                estatus: (c.Estatus === "Activo" || c.estatus === 1) ? 1 : 0,
                userId: usuarioId,
                gymId: gymId // <--- AHORA SÍ GUARDAMOS EL GYM
            }));

            await drizzleDb.insert(schema.creditosdb).values(dataToInsert);
            
            console.log(`✅ Créditos actualizados en SQLite para Gym ${gymId}`);
        } else {
            console.warn(`⚠️ No hay créditos para el Gym ${gymId} en el servidor.`);
        }
    } catch (error) {
        console.error("❌ Error al actualizar Créditos localmente:", error);
    }
};


// --- 7. ACTUALIZAR CONTRASEÑA --- //
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
        // 1. Limpiamos el contexto para evitar renderizados con datos viejos
        setUsers(null); 

        const responseApi = await gestionarSucursalesApi(correo, password, gymId);

        if (responseApi.Accion === "CambioExitoso" && responseApi.NuevoToken) {
            const nuevoUserId = responseApi.Id || responseApi.NuevoUserId; 
            const nuevoToken = responseApi.NuevoToken;

            // --- PASO CRÍTICO: Actualizar el disco antes que nada ---
            await AsyncStorage.setItem('token', nuevoToken);
            if (responseApi.RefreshToken) {
                await AsyncStorage.setItem('refreshToken', responseApi.RefreshToken);
            }

            // 2. Limpieza de base de datos local
            // Usamos una transacción o borramos en orden
            await drizzleDb.delete(schema.usersdb).where(eq(schema.usersdb.id, userIdViejo));
            await drizzleDb.delete(schema.creditosdb); 
            await drizzleDb.delete(schema.membresiasdb);

            // 3. Inserción con los datos frescos de la respuesta
            const filasNuevas = await drizzleDb.insert(schema.usersdb).values({
                id: nuevoUserId,
                gymId: gymId,
                token: nuevoToken,
                correo: correo,
                contrasena: password,
                // Usamos lo que la API ya nos dio para no mostrar campos vacíos
                nombres: responseApi.Nombre || "Cargando...", 
                apellidoPaterno: responseApi.ApellidoPaterno || "",
                apellidoMaterno: responseApi.ApellidoMaterno || "",
                telefono: responseApi.Telefono || ""
            }).returning();

            if (filasNuevas.length > 0) {
                const usuarioParaContexto = {
                    ...filasNuevas[0],
                    id: Number(filasNuevas[0].id)
                };
                
                // 4. Actualizamos el estado global
                setUsers(usuarioParaContexto);
                
                console.log(`✅ Identidad cambiada: Ahora eres ID ${nuevoUserId}`);

                // 5. Sincronización final de perfil
                // Pasamos el nuevoToken explícitamente por si el Storage tarda milisegundos
                await sincronizarPerfil(Number(nuevoUserId), correo, nuevoToken);
                
                console.log("✅ Perfil sincronizado con el servidor exitosamente.");
            }
            
            return responseApi; 
        }
    } catch (error) {
        console.error("❌ Error en el proceso de cambio de gimnasio:", error);
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

  return { registrarUsuarioProceso, loginUsuarioProceso, guardarUsuarioEnSQLite, sincronizarPerfil,sincronizarActualizacionPerfil, actualizarGimnasioSeleccionado, obtenerUsuarioLocal, obtenerMembresiasLocal, obtenerCreditosLocal, 
    actualizarBaseDatosLocalMembresia, actualizarBaseDatosLocalCreditos, actualizarPassword, enviarSugerenciaService,sincronizarClasesGimnasio, inscribirAClaseProceso, cancelarInscripcionProceso, obtenerMisClasesProceso};
}

