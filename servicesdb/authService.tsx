import { useMemo, useContext } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '@/db/schema';
import { enviarDatosRegistro } from '@/services/api'; 
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
      const resultado = await drizzleDb
        .select()
        .from(schema.usersdb)
        .where(and(eq(schema.usersdb.correo, email), eq(schema.usersdb.contrasena, password)));

      if (resultado.length > 0) {
        setUsers(resultado[0]); 
        router.replace("/home"); 
      } else {
        alert("Correo o contraseña incorrectos.");
      }
    } catch (error) {
      console.error("Error en login:", error);
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

  return { registrarUsuarioProceso, loginUsuarioProceso, guardarUsuarioEnSQLite };
}