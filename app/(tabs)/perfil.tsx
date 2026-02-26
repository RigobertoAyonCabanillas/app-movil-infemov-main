
import { Text, View } from "react-native";
import React, { useEffect, useContext } from 'react';
import { ContainerPerfil, Title, BotonSalida, NormalTextSalida, InfoSection, InfoRow, Label, Value } from "@/styles/perfilStyle";
import { UserContext } from "@/components/UserContext";
import { useAuthService } from "@/servicesdb/authService";


export default function Perfil() {

    // Extraemos 'users' (el estado) y 'sincronizarPerfil' (la función) del contexto
        const { users } = useContext(UserContext)
        const { sincronizarPerfil } = useAuthService(); // Llamamos al servicio aquí
        
        useEffect(() => {
            const cargarDatos = async () => {
            // Usamos el ID de "koko" que ya se ve en tu consola
            if (users?.id) {
                await sincronizarPerfil(users.id.toString(), users.correo);
            }
            };
            cargarDatos();
        }, []);

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