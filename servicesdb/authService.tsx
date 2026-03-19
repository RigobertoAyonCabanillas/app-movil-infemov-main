import { useMemo, useContext } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '@/db/schema';
import { actualizarPerfilApi, desencriptarDatos, enviarDatosLogin, enviarDatosRegistro, gestionarSucursalesApi, obtenerDatosPerfil, sincronizarCreditosDesdeApi, sincronizarMembresiasDesdeApi } from '@/services/api'; 
import { router } from "expo-router";
import { eq, and, sql } from 'drizzle-orm'; 
import { UserContext } from "../components/UserContext"; 
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// --- 2. LOGIN LOCAL ---
const loginUsuarioProceso = async (email: string, password: string, gymSelected: number) => {
  try {
    const respuestaApi = await enviarDatosLogin(email, password, gymSelected);

    if (respuestaApi && respuestaApi.Token) {
      // 1. LIMPIEZA TOTAL (Ya lo tienes, es excelente para evitar el error de ID duplicado)
      await drizzleDb.delete(schema.usersdb);

      // 2. INSERTAR con datos reales
      // Si el API ya te devuelve Nombres/Apellidos en el login, 
      // guárdalos de una vez para que el perfil no salga vacío al inicio.
      await drizzleDb.insert(schema.usersdb).values({
        id: respuestaApi.Id, 
        token: respuestaApi.Token,
        correo: email,
        contrasena: password,
        nombres: respuestaApi.Nombres || "", // Trata de usar lo que venga del API
        apellidoPaterno: respuestaApi.ApellidoPaterno || "",
        apellidoMaterno: respuestaApi.ApellidoMaterno || "",
        gymId: respuestaApi.GimnasioActual || gymSelected, // Backup por si el API no lo trae
        // Los demás campos pueden ir vacíos si el API no los da en el login
        estudiante: "",
        fechaNacimiento: "",
        telefono: "", 
        deviceId: "",
      });

      // 3. ACTUALIZAR ESTADO GLOBAL (MUY IMPORTANTE)
      // Agregamos TODOS los campos básicos para que el Contexto no pierda datos
      setUsers({ 
        id: respuestaApi.Id,
        token: respuestaApi.Token,
        gymId: respuestaApi.GimnasioActual || gymSelected,
        nombres: respuestaApi.Nombres || "",
        correo: email
      }); 

      console.log("✅ Sesión iniciada: ID", respuestaApi.Id, "Gym:", respuestaApi.GimnasioActual);
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
const sincronizarPerfil = async (userId: number, correo: string, token: string) => {
  try {
    // 1. Pedir a la API usando el TOKEN (ya no enviamos el userId por seguridad)
    const datosApi = await obtenerDatosPerfil(token);

    console.log("Perfilxd: ", datosApi);

    if (!datosApi) throw new Error("No se recibieron datos del servidor");

    // 2. Guardar en SQLite (MAPEANDO MAYÚSCULAS DE .NET A MINÚSCULAS DE TU SCHEMA)
    const filasActualizadas = await drizzleDb
      .update(schema.usersdb)
      .set({
        nombres: datosApi.Nombre || "",   // .NET manda 'Nombre'
        apellidoPaterno: datosApi.ApellidoPaterno || "", 
        apellidoMaterno: datosApi.ApellidoMaterno || "", 
        telefono: datosApi.Telefono || "",
        correo: datosApi.Correo || correo,
        // Mantener el token actual si el API no manda uno nuevo
        token: token 
      })
      .where(eq(schema.usersdb.id, userId))
      .returning();

    // 3. Actualizar el Contexto Global
    if (filasActualizadas.length > 0) {
      setUsers(filasActualizadas[0]);
      console.log("✅ SQLite y Contexto sincronizados con datos frescos");
    } else {
      // Si por alguna razón no estaba el registro (pasa poco), lo creamos
      const nuevoRegistro = await drizzleDb.insert(schema.usersdb).values({
        id: userId,
        correo: datosApi.Correo || correo,
        nombres: datosApi.Nombre || "",
        apellidoPaterno: datosApi.Apellido || "",
        apellidoMaterno: datosApi.Apellido || "",
        telefono: datosApi.Telefono || "",
        contrasena: "********", // No nos llega la contraseña real por seguridad
        token: token
      }).returning();
      
      setUsers(nuevoRegistro[0]);
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
    return await drizzleDb.select().from(schema.usersdb).limit(1);
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
                fechaFin: m.FechaVencimiento || m.fechaFin || "", 
                estatus: (m.Estatus === "Activa" || m.estatus === 1) ? 1 : 0,
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
        // 1. Llamar al Service de API (Cifrado y Comunicación con .NET)
        // Se envía el token actual para el [Authorize]
        const resultadoApi = await actualizarPerfilApi(nuevosDatos, users.token); 

        if (resultadoApi && resultadoApi.Token) {
            // 2. Actualizar SQLite mapeando de PascalCase (.NET) a camelCase (Drizzle)
            // Es CRÍTICO guardar el resultadoApi.Token porque el anterior ya no sirve
            const filasActualizadas = await drizzleDb
                .update(schema.usersdb)
                .set({
                    nombres: nuevosDatos.Nombre || "",
                    apellidoPaterno: nuevosDatos.ApellidoPaterno || "",
                    apellidoMaterno: nuevosDatos.ApellidoMaterno || "",
                    correo: nuevosDatos.Correo || "",
                    telefono: nuevosDatos.Telefono || "",
                    token: resultadoApi.Token // El nuevo token que mandó el backend
                })
                .where(eq(schema.usersdb.id, userId))
                .returning(); // Obtenemos el registro actualizado de la BD

            // 3. Actualizar el Contexto Global
            if (filasActualizadas.length > 0) {
                setUsers(filasActualizadas[0]); 
                console.log("✅ Perfil actualizado y Token renovado en SQLite/Contexto");
            }

            return { 
                success: true, 
                message: resultadoApi.Message || "Perfil actualizado correctamente" 
            };
        } else {
            throw new Error("La API no devolvió el nuevo token de seguridad.");
        }
    } catch (error: any) {
        console.error("❌ Error en sincronización de actualización:", error);
        // No recuperamos datos locales aquí porque es una acción de escritura que falló
        throw error; 
    }
};

const actualizarGimnasioSeleccionado = async (gymId: number, userIdViejo: number, correo: string, password: string) => {
    try {
        const responseApi = await gestionarSucursalesApi(correo, password, gymId);

        if (responseApi.Accion === "CambioExitoso" && responseApi.NuevoToken) {
            
            // 1. Obtener el NUEVO ID que el servidor asignó para este local
            // Si tu API no lo manda en 'responseApi.NuevoUserId', asegúrate de que lo haga.
            const nuevoUserId = responseApi.Id || responseApi.NuevoUserId; 

            // 2. ACTUALIZAR TODO EL REGISTRO
            // No podemos solo hacer update del ID porque es Primary Key. 
            // Lo más seguro es borrar el viejo e insertar el nuevo.
            await drizzleDb.delete(schema.usersdb).where(eq(schema.usersdb.id, userIdViejo));
            await drizzleDb.delete(schema.creditosdb); 
            await drizzleDb.delete(schema.membresiasdb);
            console.log("🧹 Memoria local de créditos/membresías limpiada para el nuevo gimnasio");

            const filasNuevas = await drizzleDb.insert(schema.usersdb).values({
                id: nuevoUserId, // <--- EL NUEVO ID DEL LOCAL 23
                gymId: gymId,
                token: responseApi.NuevoToken,
                correo: correo,
                contrasena: password,
                // ... los demás datos que tengas disponibles
            }).returning();

            // 3. Sincronizar el Contexto Global con el NUEVO ID
            if (filasNuevas.length > 0) {
                setUsers(filasNuevas[0]);
                console.log(`✅ Ahora eres el ID ${nuevoUserId} en el Gym ${gymId}`);
            }
            
            return responseApi; 
        }
    } catch (error) {
        console.error("❌ Error en cambio de local:", error);
    }
};

  return { registrarUsuarioProceso, loginUsuarioProceso, guardarUsuarioEnSQLite, sincronizarPerfil,sincronizarActualizacionPerfil, actualizarGimnasioSeleccionado, obtenerUsuarioLocal, obtenerMembresiasLocal, obtenerCreditosLocal, 
    actualizarBaseDatosLocalMembresia, actualizarBaseDatosLocalCreditos, actualizarPassword };
}

