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
  ScrollView 
} from "react-native";
import { UserContext } from "../components/UserContext";
import { useAuthService } from "@/servicesdb/authService";
import { validarFolioAPI } from "@/services/api";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.mainContainer}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.contentWrapper}>
          <View style={styles.neonPanel}>
            {!folioValidado ? (
              <>
                <Text style={styles.neonTitle}>Bienvenido</Text>
                <Text style={styles.subTitleText}>
                  Ingresa el folio de tu gimnasio para continuar
                </Text>
                
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.neonInput}
                    placeholder="Folio de Acceso"
                    placeholderTextColor="rgba(0, 229, 255, 0.4)"
                    value={folio}
                    onChangeText={setFolio}
                    autoCapitalize="characters"
                    // Esto ayuda a que el sistema sepa que es un campo de texto activo
                    importantForAutofill="no" 
                  />
                </View>

                <TouchableOpacity 
                  style={styles.neonButton} 
                  onPress={manejarValidacionFolio} 
                  disabled={cargandoFolio}
                >
                  {cargandoFolio ? (
                    <ActivityIndicator color="#00E5FF" />
                  ) : (
                    <Text style={styles.buttonText}>CONTINUAR</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.neonTitle}>Login</Text>
                <View style={styles.gymBadge}>
                  <Text style={styles.gymBadgeText}>Gimnasio: {nombreGimnasio}</Text>
                </View>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.neonInput}
                    placeholder="Correo Electrónico"
                    placeholderTextColor="rgba(0, 229, 255, 0.4)"
                    onChangeText={(text) => (emailRef.current = text)}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  <TextInput
                    style={[styles.neonInput, { marginTop: 15 }]}
                    placeholder="Contraseña"
                    placeholderTextColor="rgba(0, 229, 255, 0.4)"
                    secureTextEntry
                    onChangeText={(text) => (passwordRef.current = text)}
                  />
                </View>

                <TouchableOpacity style={styles.neonButton} onPress={handleLogin} disabled={loadingLogin}>
                  {loadingLogin ? (
                    <ActivityIndicator color="#00E5FF" />
                  ) : (
                    <Text style={styles.buttonText}>ENTRAR</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setFolioValidado(false)} style={styles.linkButton}>
                  <Text style={styles.linkText}>Cambiar de gimnasio</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push({ pathname: "/register", params: { gymId: gymSelected, gymNombre: nombreGimnasio } })}>
                  <Text style={styles.registerText}>¿No tienes cuenta? Registro</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* MODAL NEÓN */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.neonModal}>
            <Text style={styles.modalTitle}>¿Confirmar Gimnasio?</Text>
            <Text style={styles.modalBody}>
              Vas a entrar a:{"\n"}
              <Text style={styles.modalGymName}>{nombreGimnasio}</Text>
            </Text>
            
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity onPress={() => setShowConfirmModal(false)} style={styles.modalSecondaryButton}>
                <Text style={styles.modalSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => { setShowConfirmModal(false); setFolioValidado(true); }}
                style={styles.modalPrimaryButton}
              >
                <Text style={styles.modalPrimaryText}>Sí, entrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  contentWrapper: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  neonPanel: {
    width: '100%',
    backgroundColor: '#111',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.5)',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  neonTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00E5FF',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 229, 255, 0.5)',
    textShadowRadius: 10,
  },
  subTitleText: {
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
    fontSize: 14,
  },
  gymBadge: {
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    marginBottom: 20,
  },
  gymBadgeText: {
    color: '#00E5FF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 25,
  },
  neonInput: {
    width: '100%',
    height: 55,
    backgroundColor: '#000',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.4)',
    color: '#FFF',
    paddingHorizontal: 15,
    fontSize: 16,
  },
  neonButton: {
    width: '100%',
    height: 55,
    backgroundColor: '#000',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#00E5FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    color: '#00E5FF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  linkButton: {
    marginTop: 20,
  },
  linkText: {
    color: '#666',
    fontSize: 14,
  },
  registerText: {
    color: '#00E5FF',
    fontWeight: 'bold',
    marginTop: 15,
    fontSize: 15,
    opacity: 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  neonModal: {
    width: '85%',
    backgroundColor: '#080808',
    borderRadius: 20,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.5)',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalBody: {
    color: '#AAA',
    textAlign: 'center',
    marginBottom: 25,
    fontSize: 16,
    lineHeight: 22,
  },
  modalGymName: {
    color: '#00E5FF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    width: '100%',
  },
  modalSecondaryButton: {
    flex: 1,
    padding: 15,
    marginRight: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#444',
  },
  modalSecondaryText: {
    color: '#888',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  modalPrimaryButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#000',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#00E5FF',
  },
  modalPrimaryText: {
    color: '#00E5FF',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});