import { Tabs, router } from "expo-router";
import { Ionicons } from '@expo/vector-icons'; 
import { Image } from "react-native";
import { useContext } from "react";
import { UserContext } from "../../components/UserContext";
import { IconButton } from 'react-native-paper';

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
            {/* 1. HOME */}
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Inicio',
                    tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
                }}
            />

            {/* 2. PASE LISTA */}
            <Tabs.Screen
                name="paselista"
                options={{
                    title: 'Lista',
                    tabBarIcon: ({ color }) => <Ionicons name="list-outline" size={24} color={color} />,
                    href: esCoach ? undefined : null,
                }}
            />

            {/* 3. RESERVACIONES */}
            <Tabs.Screen
                name="reservaciones"
                options={{
                    title: 'Reservaciones',
                    tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={24} color={color} />,
                    href: esCoach ? null : undefined,
                }}
            />

            {/* 4. CREDITOS */}
            <Tabs.Screen
                name="creditos"
                options={{
                    title: 'Créditos',
                    tabBarIcon: ({ color }) => <Ionicons name="star-outline" size={24} color={color} />,
                    href: esCoach ? null : undefined,
                }}
            />

            {/* 5. PERFIL (Configurado con el botón de ajustes) */}
            <Tabs.Screen
                name="perfil"
                options={{
                    title: 'Mi Perfil',
                    headerRight: () => (
                        <IconButton 
                            icon="cog-outline" 
                            iconColor="#fff" 
                            size={26} 
                            onPress={() => router.push('/(settings)/ajustes')} 
                        />
                    ),
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