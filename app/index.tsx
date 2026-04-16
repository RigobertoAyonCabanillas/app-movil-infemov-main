import { useRouter } from "expo-router";
import { useContext, useRef, useState } from "react";
import { 
  Alert, 
  TouchableOpacity, 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TextInput, 
  ActivityIndicator, 
  Dimensions, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  StatusBar // Añadido para controlar la barra de estado
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context'; // Importante para los bordes del móvil
import { UserContext } from "../components/UserContext";
import { useAuthService } from "@/servicesdb/authService";
import { validarFolioAPI } from "@/services/api";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BRAND_PINK = '#FF3CAC'; 
const BRAND_GREEN = '#39FF14'; 
const PINK_FADE = 'rgba(255, 60, 172, 0.3)';
const GREEN_FADE = 'rgba(57, 255, 20, 0.1)';

export default function Login() {
  const { setUsers } = useContext(UserContext);
  const router = useRouter();
  const { loginUsuarioProceso } = useAuthService();

  const [folio, setFolio] = useState("");
  const [folioValidado, setFolioValidado] = useState(false);
  const [gymSelected, setGymSelected] = useState<number | null>(null);
  const [nombreGimnasio, setNombreGimnasio] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cargandoFolio, setCargandoFolio] = useState(false);
  const [loadingLogin, setLoadingLogin] = useState(false);

  const emailRef = useRef("");
  const passwordRef = useRef("");

  const handleLogin = async () => {
    const email = emailRef.current;
    const password = passwordRef.current;
    if (!email.trim() || !password.trim()) {
      Alert.alert("Atención", "Por favor, ingresa tus credenciales");
      return;
    }
    try {
      setLoadingLogin(true);
      const usuarioLogueado = await loginUsuarioProceso(email, password, gymSelected!);
      if (usuarioLogueado) {
        setUsers(usuarioLogueado);
        router.replace("/(tabs)/home"); 
      }
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setLoadingLogin(false);
    }
  };

  const manejarValidacionFolio = async () => {
    if (!folio.trim()) {
      Alert.alert("Atención", "Por favor, ingresa el folio.");
      return;
    }
    setCargandoFolio(true);
    try {
      const res = await validarFolioAPI(folio);
      if (res && res.id) {
        setGymSelected(res.id); 
        setNombreGimnasio(res.nombre);
        setShowConfirmModal(true); 
      }
    } catch (error) {
      Alert.alert("Error", "Folio inválido.");
    } finally {
      setCargandoFolio(false);
    }
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={styles.contentWrapper}>
            <View style={styles.neonPanel}>
              {!folioValidado ? (
                <>
                  <Text style={styles.neonTitle}>Bienvenido</Text>
                  <Text style={styles.subTitleText}>Ingresa el folio de tu gimnasio para continuar</Text>
                  
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.neonInput}
                      placeholder="Folio de Acceso"
                      placeholderTextColor="#444" 
                      value={folio}
                      onChangeText={setFolio}
                      keyboardType="numeric" 
                    />
                  </View>

                  <TouchableOpacity style={styles.neonButton} onPress={manejarValidacionFolio} disabled={cargandoFolio}>
                    {cargandoFolio ? <ActivityIndicator color={BRAND_GREEN} /> : <Text style={styles.buttonText}>CONTINUAR</Text>}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.neonTitle}>Login</Text>
                  
                  <View style={styles.gymBadge}>
                    <Text style={styles.gymBadgeText}>{nombreGimnasio}</Text>
                  </View>

                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.neonInput}
                      placeholder="Correo Electrónico"
                      placeholderTextColor="#444"
                      onChangeText={(text) => (emailRef.current = text)}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                    <TextInput
                      style={[styles.neonInput, { marginTop: 15 }]}
                      placeholder="Contraseña"
                      placeholderTextColor="#444"
                      secureTextEntry
                      onChangeText={(text) => (passwordRef.current = text)}
                    />
                  </View>

                  <TouchableOpacity style={styles.neonButton} onPress={handleLogin} disabled={loadingLogin}>
                    {loadingLogin ? <ActivityIndicator color={BRAND_PINK} /> : <Text style={styles.buttonText}>ENTRAR</Text>}
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setFolioValidado(false)} style={styles.changeGymButton}>
                    <Text style={styles.changeGymText}>CAMBIAR DE GIMNASIO</Text>
                  </TouchableOpacity>

                  <View style={styles.registerWrapper}>
                    <Text style={styles.noAccountText}>¿Eres nuevo? </Text>
                    <TouchableOpacity onPress={() => router.push({ pathname: "/register", params: { gymId: gymSelected, gymNombre: nombreGimnasio } })}>
                      <Text style={styles.registerLink}>Regístrate aquí</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.neonModal}>
            <Text style={styles.modalTitle}>¿Confirmar Gimnasio?</Text>
            <View style={styles.modalInfoRow}>
              <View style={{flex: 1}}>
                <Text style={styles.modalGymName}>{nombreGimnasio}</Text>
                <Text style={styles.modalSubText}>este es tu gimnasio</Text>
              </View>
              <View style={styles.imagePlaceholder} />
            </View>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity onPress={() => setShowConfirmModal(false)} style={styles.modalCancelBtn}>
                <Text style={{color: '#888', fontWeight: 'bold'}}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setShowConfirmModal(false); setFolioValidado(true); }} style={styles.modalConfirmBtn}>
                <Text style={{color: BRAND_GREEN, fontWeight: 'bold'}}>Sí, entrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Cambiado a flex: 1 y fondo negro total
  mainContainer: { flex: 1, backgroundColor: '#000' },
  scrollContainer: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 20,
    backgroundColor: '#000' // Aseguramos que el fondo del scroll sea negro
  },
  contentWrapper: { width: SCREEN_WIDTH, alignItems: 'center', paddingHorizontal: 20 },
  
  neonPanel: {
    width: '100%',
    backgroundColor: '#0A0A0A',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: BRAND_PINK,
    shadowColor: BRAND_PINK,
    shadowRadius: 15,
    elevation: 10,
  },
  neonTitle: { 
    fontSize: 38, 
    fontWeight: 'bold', 
    color: BRAND_PINK, 
    marginBottom: 10,
    textShadowColor: 'rgba(255, 60, 172, 0.5)',
    textShadowRadius: 10 
  },
  subTitleText: { color: '#888', textAlign: 'center', marginBottom: 25, fontSize: 14 },
  gymBadge: {
    backgroundColor: GREEN_FADE,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND_GREEN,
    marginBottom: 25,
  },
  gymBadgeText: { 
    color: BRAND_GREEN,
    fontWeight: 'bold', 
    fontSize: 16, 
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  inputContainer: { width: '100%', marginBottom: 25 },
  neonInput: { 
    width: '100%', 
    height: 55, 
    backgroundColor: '#000', 
    borderRadius: 12, 
    borderWidth: 1.5, 
    borderColor: PINK_FADE, 
    color: '#FFF', 
    paddingHorizontal: 15, 
    fontSize: 16 
  },
  neonButton: { 
    width: '100%', 
    height: 55, 
    backgroundColor: '#000', 
    borderRadius: 12, 
    borderWidth: 2, 
    borderColor: BRAND_GREEN, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  buttonText: { color: BRAND_GREEN, fontWeight: 'bold', letterSpacing: 2, fontSize: 16 },
  changeGymButton: {
    marginTop: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BRAND_GREEN,
    backgroundColor: 'transparent',
  },
  changeGymText: { 
    color: BRAND_GREEN, 
    fontSize: 12, 
    fontWeight: 'bold', 
    letterSpacing: 1,
  },
  registerWrapper: { flexDirection: 'row', marginTop: 30, alignItems: 'center' },
  noAccountText: { color: '#888', fontSize: 14 },
  registerLink: { 
    color: BRAND_GREEN,
    fontWeight: 'bold', 
    fontSize: 15, 
    textDecorationLine: 'underline',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  neonModal: { width: '85%', backgroundColor: '#0A0A0A', borderRadius: 25, padding: 25, borderWidth: 2, borderColor: BRAND_PINK },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  modalInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  modalGymName: { color: BRAND_PINK, fontWeight: 'bold', fontSize: 22, textTransform: 'uppercase' },
  modalSubText: { color: '#666', fontSize: 13, marginTop: 5 },
  imagePlaceholder: { width: 70, height: 70, borderRadius: 12, backgroundColor: '#111', marginLeft: 10, borderWidth: 1, borderColor: '#333' },
  modalButtonsRow: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#333' },
  modalConfirmBtn: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 12, borderWidth: 2, borderColor: BRAND_GREEN }
});