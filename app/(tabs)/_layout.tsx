import { Tabs } from "expo-router";
import { Ionicons } from '@expo/vector-icons'; // Expo ya lo incluye

export default function TabLayout() {


    return(
    <Tabs>
        <Tabs.Screen
        name="home"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Mi Perfil',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="creditos"
        options={{
          title: 'Creditos',
          tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={24} color={color} />,
        }}
      />
    </Tabs>
    )   
}