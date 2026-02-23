import { useMemo, useContext } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '@/db/schema';
import { enviarDatosRegistro } from '@/services/api'; 
import { router } from "expo-router";
import { eq, and } from 'drizzle-orm'; 
import { UserContext } from "../components/UserContext"; 

export function useAuthService() {
  const db = useSQLiteContext();
  const drizzleDb = useMemo(() => drizzle(db, { schema }), [db]);
  
  // Usamos los nombres exactos de tu UserContext
  const { users, setUsers } = useContext(UserContext);

  // --- 1. PROCESO DE REGISTRO MANUAL ---
  const registrarUsuarioProceso = async (datosFormulario: any) => {
    try {
      await drizzleDb.insert(schema.usersdb).values({
        nombres: datosFormulario.nombre,
        apellidos: datosFormulario.apellido,
        correo: datosFormulario.email,
        telefono: datosFormulario.telefono,
        contrasena: datosFormulario.password,
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
        alert("Hubo un error al guardar los datos localmente.");
      }
    }
  };

  // --- 2. PROCESO DE LOGIN LOCAL (Correo y Contraseña) ---
  const loginUsuarioProceso = async (email: string, password: string) => {
    try {
      const resultado = await drizzleDb
        .select()
        .from(schema.usersdb)
        .where(
          and(
            eq(schema.usersdb.correo, email),
            eq(schema.usersdb.contrasena, password)
          )
        );

      if (resultado.length > 0) {
        const usuarioEncontrado = resultado[0];
        setUsers(usuarioEncontrado); 
        console.log("✅ Login correcto:", usuarioEncontrado.nombres);
        router.replace("/home"); 
      } else {
        alert("Correo o contraseña incorrectos.");
      }
    } catch (error) {
      console.error("Error en login:", error);
      alert("Error al conectar con la base de datos local.");
    }
  };

  // --- 3. NUEVA: PROCESO PARA GOOGLE (UPSERT) ---
  const guardarUsuarioEnSQLite = async (datos: { nombres: string, apellidos: string, correo: string, token: string }) => {
    try {
      const existe = await drizzleDb
        .select()
        .from(schema.usersdb)
        .where(eq(schema.usersdb.correo, datos.correo));

      if (existe.length > 0) {
        // Si ya existe por registro previo, solo actualizamos el token de la API
        await drizzleDb.update(schema.usersdb)
          .set({ token: datos.token })
          .where(eq(schema.usersdb.correo, datos.correo));
        
        setUsers({ ...existe[0], token: datos.token });
        console.log("✅ Sesión de Google actualizada en SQLite");
      } else {
        // Si es nuevo (entró directo con Google), creamos el registro
        const nuevoRegistro = {
          nombres: datos.nombres,
          apellidos: datos.apellidos,
          correo: datos.correo,
          telefono: "S/N",
          contrasena: "AUTH_GOOGLE", // Identificador
          token: datos.token,
        };
        await drizzleDb.insert(schema.usersdb).values(nuevoRegistro);
        setUsers(nuevoRegistro);
        console.log("✅ Nuevo usuario de Google persistido localmente");
      }
    } catch (error) {
      console.error("❌ Error persistiendo datos de Google:", error);
    }
  };

  // Retornamos las 3 funciones para que tus componentes las usen
  return { 
    registrarUsuarioProceso, 
    loginUsuarioProceso, 
    guardarUsuarioEnSQLite 
  };
}