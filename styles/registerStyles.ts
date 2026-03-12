import { TextInput, TextInputProps } from "react-native";
import { Picker } from '@react-native-picker/picker';
import styled from "styled-components/native";

export const FieldGroup = styled.View` 
 width: 85%; /* Este es el ancho real de tu formulario */
 margin-bottom: 20px;
 align-items: center;
`;

export const Title = styled.Text`
  color: #a0c224;
  font-size: 45px; /* Un poco más pequeño para que no empuje todo hacia abajo */
  margin-top: 50px; /* <--- Esto bajará el "Registrarse" */
  margin-bottom: 20px;
  font-weight: bold;
  text-align: center;
`;

export const Fields = styled.Text`
  color: #a0c224;
  font-size: 18px;
  align-self: flex-start; /* Se alinea a la izquierda del contenedor */
  font-weight: bold;
`;

export const Container = styled.View`
  flex: 1;
  align-items: center;
  width: 100%;
  padding-top: 20px;
`;

export const TextInputEntrada = styled(TextInput)<TextInputProps>`
  border: 1px solid #ccc;
  padding: 10px;
  border-radius: 5px;
  width: 100%; /* Ahora ocupa todo el ancho del FieldGroup */
  height: 45px;
  margin-top: 5px;
`;

export const BotonMostrar = styled.TouchableOpacity` 
 background-color: #007bff;
  padding: 5px 15px; /* Reducimos el padding para que sea más pequeño */
  border-radius: 5px; 
  align-self: flex-end; /* Lo movemos a la derecha del contenedor */
  margin-top: 5px;
  min-width: 80px; /* Un ancho mínimo para que no se vea minúsculo */
  align-items: center;
`;

export const TextoBoton = styled.Text` color: #fff; 
  color: #fff; 
  font-size: 14px; /* Bajamos un poco el tamaño de la letra */
  font-weight: bold;
`;

export const SubmitF = styled.TouchableOpacity`
  background-color: #7da854;
  padding: 15px;
  border-radius: 8px;
  width: 100%; /* Botón a lo largo de todo el input */
  align-items: center;
`;

export const PickerContainer = styled.View`
  border-bottom-width: 1px;
  border-bottom-color: #f1f3f5;
  margin-bottom: 15px;
  justify-content: center;
  margin-left: 45px;
`;

export const StyledPicker = styled(Picker)`
  height: 60px;
  width: 80%;
`;

export const FechaRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  width: 80%;
`;

export const InputFechaCorta = styled(TextInputEntrada)`
  flex: 1;
  margin-right: 5px;
  text-align: center;
`;

export const MultiAccount = styled.Text`
  fontSize: 20px;
  color: #0c7ec0;
`;

// 2. Nuevo estilo para el ícono de Google (Circular)
export const GoogleIconButton = styled.TouchableOpacity`
  background-color: #ffffff;
  width: 50px;
  height: 50px;
  border-radius: 25px;
  justify-content: center;
  align-items: center;
  border-width: 1px;
  border-color: #ddd;
  margin-top: 10px;
  elevation: 2; /* Sombra en Android */
  shadow-color: #000; /* Sombra en iOS */
  shadow-offset: { width: 0, height: 2 };
  shadow-opacity: 0.1;
  shadow-radius: 2px;
`;