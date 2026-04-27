import React, { useContext } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Text, List, Divider, IconButton } from 'react-native-paper';
import { useRouter, Stack } from 'expo-router';
import { UserContext } from "@/components/UserContext";
import { useAuthService } from "@/servicesdb/authService";
import { MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
  bg: '#000000',
  cardBg: '#121212',
  accent: '#39FF14', 
  textMain: '#FFFFFF',
  textSub: '#A0A0A0',
  divider: '#1E1E1E',
  logout: '#FF4444',
  disabled: '#333333',
};

const SettingItem = ({ title, icon, onPress, textColor, disabled }: any) => (
  <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.7}>
    <List.Item
      title={title}
      titleStyle={[styles.itemTitle, { color: disabled ? COLORS.disabled : (textColor || COLORS.textMain) }]}
      left={props => (
        <List.Icon 
          {...props} 
          icon={icon} 
          color={disabled ? COLORS.disabled : (textColor || COLORS.textSub)} 
        />
      )}
      // SOLUCIÓN AL ERROR DE TIPOS: Usamos MaterialCommunityIcons directamente o envolvemos el List.Icon
      right={() => (
        !disabled ? (
          <View style={{ justifyContent: 'center', paddingLeft: 10 }}>
            <MaterialCommunityIcons name="chevron-right" color="#444" size={24} />
          </View>
        ) : null
      )}
      style={styles.listItem}
    />
  </TouchableOpacity>
);

export default function AjustesScreen() {
  const { setUsers } = useContext(UserContext);
  const { cerrarSesionProceso } = useAuthService();
  const router = useRouter();

  const handleLogout = async () => {
  try {
    // 1. Limpieza física total
    await cerrarSesionProceso(); 
    
    // 2. Limpiamos el estado global (Esto activa el RootNavigation)
    if (setUsers) setUsers(null); 

    // 3. Limpiamos TODO el historial acumulado de Expo Router
    if (router.canDismiss()) {
      router.dismissAll();
    }
    
    // 4. Redirigimos al Login
    router.replace("/");
    
  } catch (error) {
    if (setUsers) setUsers(null);
    router.replace("/");
  }
};

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topBar}>
        <IconButton
          icon="arrow-left"
          iconColor={COLORS.textMain}
          size={26}
          onPress={() => router.back()}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>Ajustes</Text>
      </View>

      <ScrollView 
        bounces={false} 
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <SettingItem 
            title="Cuenta" 
            icon="account-outline" 
            onPress={() => router.push('/(settings)/cuenta')} 
          />
          <Divider style={styles.divider} />

          <SettingItem 
            title="Términos y condiciones" 
            icon="file-document-outline" 
            onPress={() => router.push('/(settings)/terminos')} 
          />
          <Divider style={styles.divider} />

          <SettingItem 
            title="Métodos de pago" 
            icon="credit-card-outline" 
            onPress={() => router.push('/(settings)/metodospago')} 
          />
          <Divider style={styles.divider} />

          <SettingItem 
            title="Política de privacidad" 
            icon="lock-outline" 
            onPress={() => router.push('/(settings)/politicaprivacidad')} 
          />
          <Divider style={styles.divider} />

          <SettingItem 
            title="Envíanos tus sugerencias" 
            icon="message-draw" 
            onPress={() => router.push('/(settings)/sugerencias')} 
          />
          <Divider style={styles.divider} />

          <SettingItem 
            title="Cambiar el país" 
            icon="earth" 
            disabled={true} 
          />
          <Divider style={styles.divider} />

          <SettingItem 
            title="Cerrar sesión" 
            icon="logout" 
            textColor={COLORS.logout}
            onPress={() => {
              Alert.alert(
                "Cerrar Sesión",
                "¿Estás seguro de que quieres salir?",
                [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Salir", onPress: handleLogout, style: "destructive" }
                ]
              );
            }} 
          />
        </View>

        <View style={styles.footer}>
          <View style={styles.brandContainer}>
            <Text style={styles.brandText}>FIXSKALE</Text>
            <View style={styles.dot} />
          </View>
          <Text style={styles.versionText}>App version 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 70 : 40, 
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  backButton: { margin: 0, marginRight: 5 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.textMain },
  scrollContent: { paddingBottom: 60 },
  section: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  listItem: { paddingVertical: 10 },
  itemTitle: { fontSize: 16, fontWeight: '500' },
  divider: { backgroundColor: COLORS.divider, height: 1, marginHorizontal: 20 },
  footer: { marginTop: 60, alignItems: 'center' },
  brandContainer: { flexDirection: 'row', alignItems: 'center' },
  brandText: { color: COLORS.textMain, fontWeight: '800', fontSize: 14, letterSpacing: 2 },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: COLORS.accent, marginLeft: 6 },
  versionText: { color: COLORS.disabled, fontSize: 12, marginTop: 6 },
});