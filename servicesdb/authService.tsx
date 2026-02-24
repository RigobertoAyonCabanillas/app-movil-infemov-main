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
 const guardarUsuarioEnSQLite = async (datos: { nombres: string, apellidos: string, correo: string, token: string }) => {
    try {
      // 1. El SELECT suele funcionar bien, lo mantenemos igual
      const resultado = await drizzleDb
        .select()
        .from(schema.usersdb)
        .where(eq(schema.usersdb.correo, datos.correo));

      if (resultado.length > 0) {
        // 2. CAMBIO TÉCNICO: Usamos SQL puro a través de Drizzle para el UPDATE
        // Esto evita la función "not implemented" del ORM
        await drizzleDb.run(
          sql`UPDATE usersdb SET token = ${datos.token} WHERE correo = ${datos.correo}`
        );
        
        setUsers({ ...resultado[0], token: datos.token });
        console.log("✅ Sesión de Google actualizada con SQL-Drizzle");
      } else {
        // 3. CAMBIO TÉCNICO: Usamos SQL puro para el INSERT
        await drizzleDb.run(
          sql`INSERT INTO usersdb (nombres, apellidos, correo, telefono, contrasena, token) 
              VALUES (${datos.nombres}, ${datos.apellidos}, ${datos.correo}, 'S/N', 'AUTH_GOOGLE', ${datos.token})`
        );
        
        const nuevo = { ...datos, telefono: "S/N", contrasena: "AUTH_GOOGLE" };
        setUsers(nuevo);
        console.log("✅ Nuevo usuario de Google guardado con SQL-Drizzle");
      }
      
      router.replace("/home");
    } catch (error: any) {
      console.error("❌ Error persistente:", error.message);
    }
  };

  return { registrarUsuarioProceso, loginUsuarioProceso, guardarUsuarioEnSQLite };
}