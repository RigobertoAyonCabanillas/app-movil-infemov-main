import { useMemo, useContext } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '@/db/schema';
import { desencriptarDatos, enviarDatosLogin, enviarDatosRegistro, obtenerDatosPerfil } from '@/services/api'; 
import { router } from "expo-router";
import { eq, and, sql } from 'drizzle-orm'; 
import { UserContext } from "../components/UserContext"; 

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
const loginUsuarioProceso = async (email: string, password: string) => {
  try {
    // 1. Validar con el servidor. 
    // Como ya desencriptamos en api.js, 'respuestaApi' YA ES el objeto con ID y Token.
    const respuestaApi = await enviarDatosLogin(email, password);

    if (respuestaApi && respuestaApi.Token) {
      // 2. Limpiar sesión anterior
      await drizzleDb.delete(schema.usersdb);

      // 3. INSERTAR solo ID y TOKEN (como pediste)
      await drizzleDb.insert(schema.usersdb).values({
        id: respuestaApi.Id, // ID 
        token: respuestaApi.Token,    // Token de sesión
        correo: email,
        contrasena: password,
        nombres: "",
        apellidoPaterno: "",
        apellidoMaterno: "",
        estudiante: "",
        fechaNacimiento: "",
        telefono: "", // Asegúrate de que estos acepten strings vacíos en tu schema
        deviceId: ""
      });

      console.log("✅ ID y Token guardados en SQLite");
      
      setUsers({ id: respuestaApi.usuario.id }); 
    }
  } catch (error) {
    console.error("Error en login local:", error);
    alert("No se pudo iniciar sesión.");
  }
};

  // --- 3. PROCESO PARA GOOGLE (UPSERT) ---
  //Aqui el code es de forma nativa por incompativilidades en el desarrollo
 const guardarUsuarioEnSQLite = async (datos: { nombres: string, apellidos: string, correo: string, token: string }) => {
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
      `INSERT INTO usersdb (nombres, apellidos, correo, telefono, contrasena, token) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        datos.nombres || 'Google User',
        datos.apellidos || '',
        datos.correo || '',
        'S/N',
        'GOOGLE_LOGIN',
        datos.token
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
        correo: datosApi.Email || correo,
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
        correo: datosApi.Email || correo,
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
  const obtenerUsuarioLocal = async () => {
    return await drizzleDb.select().from(schema.usersdb).limit(1);
};

// --- 5. OBTENER MEMBRESÍAS DEL MÓVIL ROOT ---
const obtenerMembresiasLocal = async () => {
  try {
    // Usamos drizzleDb que ya definiste arriba con el schema
    const resultado = await drizzleDb.select().from(schema.membresiasdb);
    console.log("✅ Membresías recuperadas de SQLite:", resultado.length);
    return resultado;
  } catch (error) {
    console.error("❌ Error al obtener membresías locales:", error);
    return [];
  }
};

// --- INSERTAR DATO DE PRUEBA --- //Momentaneo
const insertarMembresiaTest = async () => {
  try {
    await drizzleDb.insert(schema.membresiasdb).values({
      folio: "#TEST-001",
      tipo: "Mensual Premium",
      fechaInicio: "01/03/2026",
      fechaFin: "30/03/2026",
      status: 1 // 1 para Activo
    });
    console.log("✅ Registro de prueba insertado en SQLite");
  } catch (error) {
    console.error("❌ Error al insertar test:", error);
  }
};

// --- 5. OBTENER CREDITOS DEL MÓVIL ROOT ---
const obtenerCreditosLocal = async () => {
  try {
    return await drizzleDb.select().from(schema.creditosdb);
  } catch (error) {
    console.error("❌ Error al obtener créditos:", error);
    return [];
  }
};

// --- INSERTAR DATO DE PRUEBA --- //Momentaneo
const insertarCreditoTest = async () => {
  try {
    await drizzleDb.insert(schema.creditosdb).values({
      folioCredito: "CR-9921",
      paquete: "Paquete 50 SMT",
      tipo: "Recarga Directa",
      fechaPago: "03/03/2026",
      fechaExpiracion: "03/04/2026",
      estatus: 1
    });
  } catch (error) {
    console.error("❌ Error en insert de test:", error);
  }
};

// --- ACTUALIZAR CONTRASEÑA --- //
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

  return { registrarUsuarioProceso, loginUsuarioProceso, guardarUsuarioEnSQLite, sincronizarPerfil, obtenerUsuarioLocal, obtenerMembresiasLocal,
  insertarMembresiaTest, obtenerCreditosLocal, insertarCreditoTest, actualizarPassword };
}

