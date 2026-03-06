import { TextInput, TextInputProps } from "react-native";
import { Picker } from '@react-native-picker/picker';
import styled from "styled-components/native";

export const FieldGroup = styled.View` 
 width: 100%; 
 margin-bottom: 20px;
`;

export const Title = styled.Text`
  color: #a0c224;
  font-size: 60px;
  margin-bottom: 10px;
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