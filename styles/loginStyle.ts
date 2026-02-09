import { TextInput, TextInputProps } from "react-native";
import styled from "styled-components/native";

export const Title = styled.Text`
  color: #a0c224;
  font-size: 60px;
`;

export const Registros = styled.Text`
  color: #a0c224;
  font-size: 25px;
`;

export const Container = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

export const TextInputEntrada = styled(TextInput)<TextInputProps>`
  color: #000000;
  border-width: 1;
  border-color: black;
  padding: 0.2em
`;

export const MultiAccount = styled.Text`
  fontSize: 20px;
  color: #0c7ec0;
`;