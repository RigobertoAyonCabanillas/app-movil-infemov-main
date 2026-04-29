import { Stack } from 'expo-router';
import { useContext } from 'react';
import { UserContext } from '../../components/UserContext';

export default function SettingsLayout() {
  const { users } = useContext(UserContext);

  // Si no hay usuario, no renderizamos el Stack de settings.
  // Esto evita que al cerrar sesión se vea brevemente la pantalla de 'ajustes'.
  if (!users) return null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#000000' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerShadowVisible: false,
        headerBackTitle: "Atrás",
      }}
    >
      <Stack.Screen name="ajustes" options={{ headerTitle: "Ajustes" }} />
      <Stack.Screen name="cuenta" options={{ headerTitle: "Mi Cuenta" }} />
      <Stack.Screen name="terminos" options={{ headerTitle: "Términos y Condiciones" }} />
      <Stack.Screen name="metodospago" options={{ headerTitle: "Métodos de Pago" }} />
      <Stack.Screen name="politicaprivacidad" options={{ headerTitle: "Privacidad" }} />
      <Stack.Screen name="sugerencias" options={{ headerTitle: "Sugerencias" }} />
      <Stack.Screen name="cambiarpais" options={{ headerTitle: "Cambiar País" }} />
    </Stack>
  );
}