import React, { useContext } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Text, List, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { UserContext } from "@/components/UserContext";
import { useAuthService } from "@/servicesdb/authService"; // Importamos tu hook
import { MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
  bg: '#000000',
  cardBg: '#121212',
  accent: '#39FF14', 
  textMain: '#FFFFFF',
  textSub: '#A0A0A0',
  divider: '#2C2C2C',
  logout: '#FF4444',
  disabled: '#444444',
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
      right={props => (
        // Quitamos el size={20} para evitar el error de tipos de TS
        !disabled && <List.Icon {...props} icon="chevron-right" color={COLORS.disabled} />
      )}
      style={styles.listItem}
    />
  </TouchableOpacity>
);

export default function AjustesScreen() {
  const { setUsers } = useContext(UserContext);
  const { cerrarSesionProceso } = useAuthService(); // Extraemos la función del hook
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // 1. Ejecutamos la limpieza profunda (SQLite, Storage, Contexto)
      await cerrarSesionProceso();
      
      // Nota: cerrarSesionProceso ya debería tener el router.replace("/") 
      // pero lo reforzamos aquí por si acaso.
      router.replace("/");
      
    } catch (error) {
      console.log("Error al procesar el cierre de sesión:", error);
      // Fallback de seguridad: limpiar contexto y sacar al usuario
      if (setUsers) setUsers(null);
      router.replace("/");
    }
  };

  return (
    <ScrollView style={styles.container} bounces={false}>
      <View style={styles.header}>
      </View>

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
          onPress={null} 
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
              "¿Estás seguro de que quieres salir? Se borrarán los datos de acceso local.",
              [
                { text: "Cancelar", style: "cancel" },
                { 
                  text: "Salir", 
                  onPress: handleLogout, 
                  style: "destructive" 
                }
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
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.bg 
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textMain,
  },
  section: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 15,
    marginHorizontal: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  listItem: { 
    paddingVertical: 8 
  },
  itemTitle: { 
    fontSize: 16, 
    fontWeight: '500' 
  },
  divider: { 
    marginLeft: 60, 
    backgroundColor: COLORS.divider,
    height: 1 
  },
  footer: { 
    marginTop: 50, 
    alignItems: 'center', 
    paddingBottom: 40 
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  brandText: {
    color: COLORS.accent,
    fontWeight: '900',
    letterSpacing: 2,
    fontSize: 14,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
    marginLeft: 4,
  },
  versionText: { 
    color: COLORS.disabled, 
    fontSize: 12 
  },
});