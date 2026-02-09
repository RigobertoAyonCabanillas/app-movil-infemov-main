import { TextInput, TextInputProps } from "react-native";
import styled from "styled-components/native";

export const FieldGroup = styled.View` 
 width: 100%; 
 margin-bottom: 20px;
`;

export const Title = styled.Text`
  color: #a0c224;
  font-size: 60px;
  margin-bottom: 50px;
`;

export const Fields = styled.Text`
  color: #a0c224;
  font-size: 20px;
  margin-left: 50px;
  padding-left: 10px;
`;

export const Container = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  margin-bottom: 200px;
`;

export const TextInputEntrada = styled(TextInput)<TextInputProps>`
  border: 1px solid #ccc;
  padding: 10px;
  border-radius: 5px;
  text-align: left;
  width: 70%;  
  height: 45px;    
  flex-shrink: 0;    
  flex-grow: 0;     
  margin-left: 50px; 
`;

export const BotonMostrar = styled.TouchableOpacity` 
 background-color: #007bff;
 padding: 10px 20px;
 border-radius: 5px; 
 align-self: flex-start; 
 margin-left: 50px;
`;

export const TextoBoton = styled.Text` color: #fff; 
 font-size: 16px;
`;

export const SubmitF = styled.TouchableOpacity`
background-color: #7da854;
 padding: 10px 20px;
 border-radius: 5px; 
 align-self: flex-start; 
 margin-left: 50px;
`;