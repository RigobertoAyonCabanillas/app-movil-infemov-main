import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        // Estilo global para las cabeceras de ajustes
        headerStyle: {
          backgroundColor: '#000000',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShadowVisible: false, // Mantiene el look limpio de tu referencia
        headerBackTitle: "Atrás",
      }}
    >
      {/* Definición de cada pantalla para personalizar el título */}
      <Stack.Screen 
        name="ajustes" 
        options={{ 
          headerTitle: "Ajustes" 
        }} 
      />
      <Stack.Screen 
        name="cuenta" 
        options={{ 
          headerTitle: "Mi Cuenta" 
        }} 
      />
      <Stack.Screen 
        name="terminos" 
        options={{ 
          headerTitle: "Términos y Condiciones" 
        }} 
      />
      <Stack.Screen 
        name="metodospago" 
        options={{ 
          headerTitle: "Métodos de Pago" 
        }} 
      />
      <Stack.Screen 
        name="politicaprivacidad" 
        options={{ 
          headerTitle: "Privacidad" 
        }} 
      />
      <Stack.Screen 
        name="sugerencias" 
        options={{ 
          headerTitle: "Sugerencias" 
        }} 
      />
      <Stack.Screen 
        name="cambiarpais" 
        options={{ 
          headerTitle: "Cambiar País" 
        }} 
      />
    </Stack>
  );
}