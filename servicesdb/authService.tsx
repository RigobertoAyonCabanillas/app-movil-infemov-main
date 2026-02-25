import { useMemo, useContext } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '@/db/schema';
import { desencriptarDatos, enviarDatosLogin, enviarDatosRegistro } from '@/services/api'; 
import { router } from "expo-router";
import { eq, and, sql } from 'drizzle-orm'; 
import { UserContext } from "../components/UserContext"; 

export function useAuthService() {
  const db = useSQLiteContext();
  const drizzleDb = useMemo(() => drizzle(db, { schema }), [db]);
  const { users, setUsers } = useContext(UserContext);

  // --- 1. REGISTRO (SQLite + API) ---
const registrarUsuarioProceso = async (datosFormulario: any) => {
  try {
    // 1. Guardar en SQLite primero (Persistencia local)
    await drizzleDb.insert(schema.usersdb).values({
      nombres: datosFormulario.nombre,
      apellidos: datosFormulario.apellido,
      correo: datosFormulario.email,
      telefono: datosFormulario.telefono,
      contrasena: datosFormulario.password, // Recuerda: idealmente aquí va el HASH
      deviceId: datosFormulario.deviceId,   // <--- AGREGAR ESTO para guardar el ID localmente
      token: null, 
    });

    console.log("✅ Guardado en SQLite con éxito");

    // 2. Intentar registro en la API externa (.NET)
    try {
      // Enviamos el objeto completo que ya trae el deviceId y pasará por el cifrado AES
      await enviarDatosRegistro(datosFormulario); 
      console.log("🚀 Sincronizado con el servidor");
    } catch (apiError) {
      // Como ingeniero, esto es un "Offline-First approach"
      console.warn("⚠️ Falló API, pero el dato está en el móvil:", apiError);
    }

    alert("¡Registro exitoso!");
    router.replace("/"); // Regresa al Login

  } catch (dbError: any) {
    // Manejo de errores de base de datos local
    if (dbError.message?.includes("UNIQUE constraint failed")) {
      alert("Error: Este correo electrónico ya está registrado en este dispositivo.");
    } else {
      console.error("❌ Error de DB:", dbError);
      alert("Hubo un error al guardar los datos localmente.");
    }
  }
};

  // --- 2. LOGIN (Híbrido: API + Local) ---
const loginUsuarioProceso = async (email: string, password: string) => {
  try {
    // 1. Llamada al API (Obtenemos el objeto { Data: "..." } encriptado)
    const respuestaApiRaw = await enviarDatosLogin(email, password);

    // Verificamos ambas posibilidades (Data o data)
    const stringCifrado = respuestaApiRaw?.data || respuestaApiRaw?.Data;

    // 2. DESENCRIPTAR
    if (stringCifrado) {
    const datosUsuario = desencriptarDatos(stringCifrado);

    // ... resto de tu lógica para Drizzle
    if (datosUsuario) {
      console.log("✅ Datos desencriptados:", datosUsuario);
      console.log("Estructura exacta del usuario:", Object.keys(datosUsuario));

      // 3. Guardar en SQLite con Drizzle
      await drizzleDb
        .insert(schema.usersdb)
        .values({//por corregir
          id: datosUsuario.id, 
          nombres: datosUsuario.nombres,
          apellidos: datosUsuario.apellidos,
          correo: datosUsuario.correo,
          telefono: datosUsuario.telefono,
          contrasena: password, // O la que prefieras manejar localmente
          token: datosUsuario.token
        })
        .onConflictDoUpdate({
          target: schema.usersdb.id,
          set: { 
            token: datosUsuario.token,
            nombres: datosUsuario.nombres 
          }
        });

      // 4. Actualizar estado global y navegar
      setUsers(datosUsuario); 
      router.replace("/(tabs)/home"); 
    } else {
      alert("Error al procesar los datos de seguridad del servidor.");
    }
    } else {
    console.error("❌ No se encontró la propiedad de datos cifrados en la respuesta");
  }
  } catch (error) {
    console.error("Error en el flujo de login:", error);
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
    router.replace("/(tabs)/home");

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

  return { registrarUsuarioProceso, loginUsuarioProceso, guardarUsuarioEnSQLite };
}