import { Text, View, StyleSheet, ScrollView } from "react-native";
import React, { useContext, useCallback, useLayoutEffect } from 'react';
import { IconButton } from 'react-native-paper';
import { UserContext } from "@/components/UserContext";
import { useAuthService } from "@/servicesdb/authService";
import { useFocusEffect, useNavigation, router } from 'expo-router'; 


// Componente de Tarjeta con estilo premium
const InfoCard = ({ icon, label, value }: { icon: string, label: string, value?: string }) => (
    <View style={styles.card}>
        <View style={styles.iconContainer}>
            <IconButton icon={icon} iconColor="#99bc1a" size={24} />
        </View>
        <View style={styles.textContainer}>
            <Text style={styles.cardLabel}>{label}</Text>
            <Text style={styles.cardValue}>{value || "No disponible"}</Text>
        </View>
    </View>
);

export default function Perfil() {
    const { users } = useContext(UserContext);
    const { sincronizarPerfil } = useAuthService();
    const navigation = useNavigation();

    // Configuración de la cabecera: La tuerca redirige a ajustes
    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: "Mi Perfil",
            headerRight: () => (
                <IconButton 
                    icon="cog-outline" 
                    iconColor="#333" 
                    size={26} 
                    onPress={() => router.push('/(settings)/ajustes')} // Redirección directa
                />
            ),
        }); 
    }, [navigation]);

    // Sincronización de datos al enfocar la pantalla
    useFocusEffect(
        useCallback(() => {
            const currentId = users?.id || users?.Id;
            const currentCorreo = users?.correo || users?.Correo;
            
            // Si el ID es el del gimnasio viejo o está vacío, no sincronices
            if (currentId && currentCorreo) {
                // Agregamos un pequeño delay opcional para dejar que el Contexto respire
                const timeout = setTimeout(() => {
                    console.log("🚀 Sincronizando Perfil con ID:", currentId);
                    sincronizarPerfil(currentId, currentCorreo).catch(console.error);
                }, 500); 

                return () => clearTimeout(timeout);
            }
        }, [users?.id, users?.gymId]) // Escucha cambios específicos
    );

    return (
        <ScrollView style={styles.mainContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.headerSection}>
                <Text style={styles.mainTitle}>Perfil Usuario</Text>
                <Text style={styles.subTitle}>Gestiona tu información personal</Text>
            </View>

            <View style={styles.cardsContainer}>
                <InfoCard icon="account-outline" label="Nombre" value={users?.nombres} />
                <InfoCard icon="account-details-outline" label="Apellido Paterno" value={users?.apellidoPaterno} />
                <InfoCard icon="account-details-outline" label="Apellido Materno" value={users?.apellidoMaterno} />
                <InfoCard icon="email-outline" label="Correo" value={users?.correo} />
                <InfoCard icon="phone-outline" label="Teléfono" value={users?.telefono} />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#FBFBFE',
    },
    headerSection: {
        marginTop: 30,
        marginBottom: 30,
        paddingHorizontal: 25,
    },
    mainTitle: {
        fontSize: 42,
        color: '#99bc1a',
        fontWeight: 'bold',
        letterSpacing: -1,
    },
    subTitle: {
        fontSize: 16,
        color: '#888',
        marginTop: -5,
    },
    cardsContainer: {
        paddingHorizontal: 20,
        gap: 5, // Mejora la separación entre tarjetas
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingVertical: 12,
        paddingHorizontal: 15,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    iconContainer: {
        backgroundColor: '#F5F9E5',
        borderRadius: 12,
        marginRight: 15,
    },
    textContainer: {
        flex: 1,
    },
    cardLabel: {
        fontSize: 12,
        color: '#AAA',
        textTransform: 'uppercase',
        fontWeight: 'bold',
        marginBottom: 2,
    },
    cardValue: {
        fontSize: 17,
        color: '#333',
        fontWeight: '600',
    },
});