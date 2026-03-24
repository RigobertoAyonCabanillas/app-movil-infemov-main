import { Tabs } from "expo-router";
import { Ionicons } from '@expo/vector-icons'; // Expo ya lo incluye
import { Image} from "react-native";


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
        name="reservaciones"
        options={{
          title: 'Reservaciones',
          tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="creditos"
        options={{
          title: 'Creditos',
          tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
      name="perfil"
      options={{
        title: 'Mi Perfil',
        tabBarIcon: ({ focused }) => (
          <Image
            source={{ uri: 'https://i.redd.it/qm3p4sotkjgd1.jpeg' }} // O un require local
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              borderWidth: focused ? 2 : 0, // Se bordea si está seleccionado
              borderColor: '#007AFF', // Color azul del tab activo
            }}
          />
        ),
      }}
      />
    </Tabs>
    )   
}