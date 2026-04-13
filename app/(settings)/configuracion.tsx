import React, { useContext } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, List, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { UserContext } from "@/components/UserContext";

// NOTA: Quitamos el import de arriba para evitar que rompa el Sitemap.
// La función se cargará dinámicamente al presionar el botón.

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
  <TouchableOpacity onPress={onPress} disabled={disabled}>
    <List.Item
      title={title}
      titleStyle={[styles.itemTitle, { color: textColor || COLORS.textMain }]}
      left={props => (
        <List.Icon 
          {...props} 
          icon={icon} 
          color={disabled ? COLORS.disabled : (textColor || COLORS.textSub)} 
        />
      )}
      right={props => (
        !disabled && <List.Icon {...props} icon="chevron-right" color={COLORS.disabled} />
      )}
      style={styles.listItem}
    />
  </TouchableOpacity>
);

export default function AjustesScreen() {
  const context = useContext(UserContext);
  const setUsers = context?.setUsers;
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // CARGA DINÁMICA: Esto evita que el archivo se rompa al cargar la pantalla
      const { cerrarSesionUniversal } = await import('../../services/authgoogle');
      
      await cerrarSesionUniversal(); 
      
      if (setUsers) setUsers(null);
      router.replace("/");
    } catch (error) {
      console.log("Error en logout, redirigiendo igual:", error);
      if (setUsers) setUsers(null);
      router.replace("/");
    }
  };

  return (
    <ScrollView style={styles.container}>
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
          title="Cerrar sesión" 
          icon="logout" 
          textColor={COLORS.logout}
          onPress={handleLogout} 
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.versionText}>App version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  section: {
    marginTop: 20,
    backgroundColor: COLORS.cardBg,
    borderRadius: 10,
    marginHorizontal: 15,
    overflow: 'hidden',
  },
  listItem: { paddingVertical: 10 },
  itemTitle: { fontSize: 16, fontWeight: '500' },
  divider: { marginLeft: 60, backgroundColor: COLORS.divider },
  footer: { marginTop: 40, alignItems: 'center', paddingBottom: 30 },
  versionText: { color: COLORS.disabled, fontSize: 12 },
});