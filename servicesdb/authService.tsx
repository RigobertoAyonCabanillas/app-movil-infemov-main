import { useMemo, useContext } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '@/db/schema';
import { desencriptarDatos, enviarDatosLogin, enviarDatosRegistro, obtenerDatosPerfil } from '@/services/api'; 
import { router } from "expo-router";
import { eq, and, sql } from 'drizzle-orm'; 
import { UserContext } from "../components/UserContext"; 

export function useAuthService() {
  const db = useSQLiteContext();
  const drizzleDb = useMemo(() => drizzle(db, { schema }), [db]);
  const { users, setUsers } = useContext(UserContext);

  // --- 1. REGISTRO MANUAL ---
  const registrarUsuarioProceso = async (datosFormulario: any) => {
    try {
      await drizzleDb.insert(schema.usersdb).values({
        id: datosFormulario.email, // Usamos el email como ID temporal para que no sea nulo
        nombres: datosFormulario.nombre,
        apellidos: datosFormulario.apellido,
        correo: datosFormulario.email,
        telefono: datosFormulario.telefono,
        contrasena: datosFormulario.password,
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
        apellidos: "",
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
    console.log("💾 Iniciando guardado con bypass de seguridad...");

    // 1. Si db es nulo, no disparamos nada para evitar el crash
    if (!db) {
      console.error("Conexión perdida. Reintentando en 1 segundo...");
      setTimeout(() => guardarUsuarioEnSQLite(datos), 5000);
      return;
    }

    // 2. FORZAMOS el uso de execAsync (es el método más crudo y estable de SQLite)
    // Este método no usa 'prepareAsync', por lo que NO debería lanzar el NullPointer
    await db.execAsync(`
      INSERT INTO usersdb (nombres, apellidos, correo, telefono, contrasena, token)
      VALUES ('${datos.nombres}', '${datos.apellidos}', '${datos.correo}', 'S/N', 'GOOGLE_LOGIN', '${datos.token}')
    `);

    console.log("✅ ¡GUARDADO EXITOSO CON EXEC_ASYNC!");
    
    setUsers({ ...datos, telefono: "S/N", contrasena: "GOOGLE_LOGIN" });
    router.replace("/home");

  } catch (error: any) {
    // Si el error es "UNIQUE constraint", significa que ya existe, así que hacemos el UPDATE
    if (error.message.includes("UNIQUE")) {
       await db.execAsync(`
         UPDATE usersdb SET token = '${datos.token}' WHERE correo = '${datos.correo}';
       `);
       console.log("✅ ¡TOKEN ACTUALIZADO!");
       router.replace("/home");
    } else {
       console.error("🛑 Error persistente:", error.message);
    }
  }
};

 // --- 4. Función para sincronizar la base de datos local ---
const sincronizarPerfil = async (userId: string, correo: string, token: string) => {
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
        apellidos: datosApi.Apellido || "", 
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
        apellidos: datosApi.Apellido || "",
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

  return { registrarUsuarioProceso, loginUsuarioProceso, guardarUsuarioEnSQLite, sincronizarPerfil, obtenerUsuarioLocal };
}

