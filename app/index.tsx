import { useRouter } from "expo-router";
import { useContext, useRef, useState } from "react";
import { Alert, TouchableOpacity, View, Text, Modal } from "react-native";
import { UserContext } from "../components/UserContext";
import { 
  Container, 
  Registros, 
  TextInputEntrada, 
  Title, 
  FormGroup, 
  BotonEntrar, 
  BotonTexto 
} from "../styles/loginStyle";
import { useAuthService } from "@/servicesdb/authService";
import { enviarDatosLogin, validarFolioAPI } from "@/services/api";

export default function Login() {
  const { setUsers } = useContext(UserContext);
  const router = useRouter();
  const { loginUsuarioProceso } = useAuthService();

  // Estados de Folio y Login (Se mantienen igual)
  const [folio, setFolio] = useState("");
  const [folioValidado, setFolioValidado] = useState(false);
  const [gymSelected, setGymSelected] = useState<number | null>(null);
  const [nombreGimnasio, setNombreGimnasio] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cargandoFolio, setCargandoFolio] = useState(false);

  const emailRef = useRef("");
  const passwordRef = useRef("");

  const handleLogin = async () => {
    const email = emailRef.current;
    const password = passwordRef.current;

    if (!email.trim() || !password.trim()) {
      Alert.alert("Atención", "Por favor, ingresa tus credenciales");
      return;
    }

    if (!gymSelected) {
      Alert.alert("Error", "No se ha detectado el gimnasio.");
      setFolioValidado(false);
      return;
    }

    try {
      // 1. Ejecuta el proceso que guarda en SQLite y actualiza el Contexto
      const usuarioLogueado = await loginUsuarioProceso(email, password, gymSelected);

      if (usuarioLogueado) {
        setUsers(usuarioLogueado);
        // Ambos van a Home, pero el Coach verá botones distintos en la barra inferior
        router.replace("/(tabs)/home"); 
      }
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : "Error desconocido";
      Alert.alert("Error de Autenticación", mensaje);
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

  const irARegistro = () => {
    router.push({
      pathname: "/register",
      params: { gymId: gymSelected, gymNombre: nombreGimnasio }
    });
  };

  return (
    <>
      <Container>
        {!folioValidado ? (
          /* --- VISTA A: FOLIO --- */
          <>
            <Title>Bienvenido</Title>
            <FormGroup>
              <Text style={{ textAlign: 'center', marginBottom: 15, color: '#666' }}>
                Ingresa el folio de tu gimnasio para continuar
              </Text>
              
              <TextInputEntrada
                placeholder="Folio de Acceso"
                value={folio}
                onChangeText={setFolio}
                autoCapitalize="characters"
              />

              <BotonEntrar onPress={manejarValidacionFolio} disabled={cargandoFolio}>
                <BotonTexto>{cargandoFolio ? "VERIFICANDO..." : "CONTINUAR"}</BotonTexto>
              </BotonEntrar>
              
            </FormGroup>
          </>
        ) : (
          /* --- VISTA B: LOGIN --- */
          <>
            <Title>Login</Title>
            <Text style={{ color: '#7da854', fontWeight: 'bold', textAlign: 'center', marginBottom: 10 }}>
              Gimnasio: {nombreGimnasio}
            </Text>

            <FormGroup>
              <TextInputEntrada
                placeholder="Correo"
                onChangeText={(text: string) => (emailRef.current = text)}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <TextInputEntrada
                placeholder="Contraseña"
                secureTextEntry={true}
                onChangeText={(text: string) => (passwordRef.current = text)}
              />

              <BotonEntrar onPress={handleLogin}>
                <BotonTexto>ENTRAR</BotonTexto>
              </BotonEntrar>

              <TouchableOpacity onPress={() => setFolioValidado(false)}>
                <Text style={{ textAlign: 'center', marginTop: 10, color: '#999' }}>
                  Cambiar de gimnasio
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={irARegistro}>
                <Registros>Registro</Registros>
              </TouchableOpacity>
            </FormGroup>
          </>
        )}
      </Container>

      {/* --- EL MODAL FUERA DEL CONTAINER --- */}
      <Modal 
        visible={showConfirmModal} 
        transparent={true} // Se agregó explícitamente el boolean
        animationType="fade"
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', padding: 25, borderRadius: 20, width: '85%', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>¿Confirmar Gimnasio?</Text>
            <Text style={{ textAlign: 'center', marginBottom: 20 }}>
              Vas a entrar a:{"\n"}
              <Text style={{ fontWeight: 'bold', color: '#82B451' }}>{nombreGimnasio}</Text>
            </Text>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity 
                onPress={() => setShowConfirmModal(false)}
                style={{ flex: 1, padding: 12, marginRight: 5, borderRadius: 10, borderWidth: 1, borderColor: '#ccc' }}
              >
                <Text style={{ textAlign: 'center' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => { setShowConfirmModal(false); setFolioValidado(true); }}
                style={{ flex: 1, padding: 12, backgroundColor: '#82B451', borderRadius: 10 }}
              >
                <Text style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>Sí, entrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}