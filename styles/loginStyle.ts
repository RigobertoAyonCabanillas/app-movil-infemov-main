import { TextInput, TextInputProps } from "react-native";
import styled from "styled-components/native";

export const Container = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: #ffffff;
`;

export const Title = styled.Text`
  color: #a0c224;
  font-size: 60px;
  margin-bottom: 30px;
  font-weight: bold;
`;

export const FormGroup = styled.View`
  width: 85%;
  align-items: center;
  gap: 15px;
`;

export const TextInputEntrada = styled(TextInput)<TextInputProps>`
  color: #000000;
  border: 1px solid #cccccc; /* Esto define los 4 lados por igual */
  border-radius: 8px;
  padding: 12px;
  width: 100%;
  font-size: 16px;
  background-color: #ffffff; /* Evita que el fondo cambie con el autocompletado */
`;

// Nuevo: Botón personalizado
export const BotonEntrar = styled.TouchableOpacity`
  background-color: #007AFF; /* O el color azul de tu imagen */
  width: 100%;
  padding: 15px;
  border-radius: 8px;
  align-items: center;
  margin-top: 10px;
`;

// Nuevo: Texto dentro del botón
export const BotonTexto = styled.Text`
  color: white;
  font-size: 18px;
  font-weight: bold;
`;

export const Registros = styled.Text`
  color: #a0c224;
  font-size: 20px;
  margin-top: 20px;
`;