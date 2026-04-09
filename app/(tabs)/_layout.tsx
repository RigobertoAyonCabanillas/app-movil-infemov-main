import { Tabs } from "expo-router";
import { Ionicons } from '@expo/vector-icons'; 
import { Image } from "react-native";
import { useContext } from "react";
import { UserContext } from "../../components/UserContext";

export default function TabLayout() {
    const { users } = useContext(UserContext);
    const esCoach = users?.rol === 'Coach';

    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: '#39FF14',
            headerStyle: { backgroundColor: '#000' },
            headerTintColor: '#fff',
            tabBarStyle: { backgroundColor: '#000' }
        }}>
            {/* 1. HOME: Visible para AMBOS */}
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Inicio',
                    tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
                }}
            />

            {/* 2. PASE LISTA: Solo para Coach */}
            <Tabs.Screen
                name="paselista"
                options={{
                    title: 'Lista',
                    tabBarIcon: ({ color }) => <Ionicons name="list-outline" size={24} color={color} />,
                    href: esCoach ? undefined : null, // Oculto para clientes
                }}
            />

            {/* 3. RESERVACIONES: Solo para Clientes */}
            <Tabs.Screen
                name="reservaciones"
                options={{
                    title: 'Reservaciones',
                    tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={24} color={color} />,
                    href: esCoach ? null : undefined, // Oculto para coach
                }}
            />

            {/* 4. CREDITOS: Solo para Clientes */}
            <Tabs.Screen
                name="creditos"
                options={{
                    title: 'Créditos',
                    tabBarIcon: ({ color }) => <Ionicons name="star-outline" size={24} color={color} />,
                    href: esCoach ? null : undefined, // Oculto para coach
                }}
            />

            {/* 5. PERFIL: Visible para AMBOS */}
            <Tabs.Screen
                name="perfil"
                options={{
                    title: 'Mi Perfil',
                    tabBarIcon: ({ focused }) => (
                        <Image
                            source={{ uri: 'https://i.redd.it/qm3p4sotkjgd1.jpeg' }} 
                            style={{
                                width: 26,
                                height: 26,
                                borderRadius: 13,
                                borderWidth: focused ? 2 : 0,
                                borderColor: '#39FF14', 
                            }}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}