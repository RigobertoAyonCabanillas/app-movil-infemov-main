
import { Text, View } from "react-native";
import React, { useEffect, useContext, useCallback } from 'react';
import { ContainerPerfil, Title, BotonSalida, NormalTextSalida, InfoSection, InfoRow, Label, Value } from "@/styles/perfilStyle";
import { UserContext } from "@/components/UserContext";
import { useAuthService } from "@/servicesdb/authService";
import { useFocusEffect } from 'expo-router'; // o 'react-navigation/native'


export default function Perfil() {

    // Extraemos 'users' (el estado) y 'sincronizarPerfil' (la función) del contexto
        const { users } = useContext(UserContext)
        const { sincronizarPerfil, obtenerUsuarioLocal } = useAuthService(); // Llamamos al servicio aquí

        useFocusEffect(
          useCallback(() => {
            const cargarDatosCadaVez = async () => {
            console.log("Nomada: Entrando a Perfil...");
            console.log("Datos locos: ", users)

            if (users?.id && users?.token) {
                // Usamos || "" para asegurar que siempre sea string y no null
                await sincronizarPerfil(
                    users.id.toString(), 
                    users.correo || "", 
                    users.token || ""
                );
            } else {
                // Buscamos en SQLite si el contexto está vacío
                const local = await obtenerUsuarioLocal();
                if (local && local.length > 0) {
                    // Accedemos a los datos de la primera fila de la tabla usersdb
                    await sincronizarPerfil(
                        local[0].id || "", 
                        local[0].correo || "", 
                        local[0].token || ""
                    );
                }
            }
        };

        cargarDatosCadaVez();
         }, [users?.id, users?.token]) // Escuchamos cambios en ID o Token
    );

    return(

        <ContainerPerfil>
            <Title>Perfil Usuario</Title>

            <InfoSection>
                <InfoRow>
                    <Label>Nombre</Label>
                    {/* Usamos 'users' directamente del contexto global */}
                    <Value>{users?.nombres || "Cargando..."}</Value>
                </InfoRow>
                <InfoRow>
                    <Label>Apellidos</Label>
                    <Value>{users?.apellidos || "Cargando..."}</Value>
                </InfoRow>
                <InfoRow>
                    <Label>Correo</Label>
                    <Value>{users?.correo}</Value>
                </InfoRow>
                <InfoRow>
                    <Label>Teléfono</Label>
                    <Value>{users?.telefono}</Value>
                </InfoRow>
            </InfoSection>

        </ContainerPerfil>

    );
    
}