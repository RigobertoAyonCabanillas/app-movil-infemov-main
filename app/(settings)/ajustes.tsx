import React, { useContext } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, List, Divider, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { UserContext } from "@/components/UserContext";
import { cerrarSesionUniversal } from '../../services/authgoogle';

const AjustesScreen = () => {
  const { setUsers } = useContext(UserContext);
  const router = useRouter();
  const theme = useTheme();

  const handleLogout = async () => {
    try {
      await cerrarSesionUniversal();
      setUsers(null);
      router.replace("/");
    } catch (error) {
      router.replace("/");
    }
  };

  // Componente reutilizable para cada opción del menú
  const SettingItem = ({ title, icon, onPress, textColor }: any) => (
    <TouchableOpacity onPress={onPress}>
      <List.Item
        title={title}
        titleStyle={[styles.itemTitle, textColor && { color: textColor }]}
        left={props => <List.Icon {...props} icon={icon} color={textColor || "#555"} />}
        right={props => <List.Icon {...props} icon="chevron-right" color="#CCC" />}
        style={styles.listItem}
      />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
        onPress={null} // Al poner null, el botón dejará de funcionar
        textColor="#b4aeae" // Puedes ponerlo en gris para que parezca desactivado
        />
        <Divider style={styles.divider} />

        <SettingItem 
          title="Cerrar sesión" 
          icon="logout" 
          textColor="#d32f2f"
          onPress={handleLogout} 
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.versionText}>App version 1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginTop: 10,
    backgroundColor: '#fff',
  },
  listItem: {
    paddingVertical: 8,
  },
  itemTitle: {
    fontSize: 16,
    color: '#333',
  },
  divider: {
    marginLeft: 55, // Alineado con el inicio del texto para un look más limpio
    backgroundColor: '#F0F0F0',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
    paddingBottom: 30,
  },
  versionText: {
    color: '#999',
    fontSize: 12,
  },
});

export default AjustesScreen;