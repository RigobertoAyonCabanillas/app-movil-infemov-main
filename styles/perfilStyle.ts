import { TextInput, TextInputProps, TouchableOpacity, Text, View } from "react-native";
import styled from "styled-components/native";

export const Title = styled.Text`
  color: #a0c224;
  font-size: 60px;
`;
export const ContainerPerfil = styled.View`
  flex: 1;
  background-color: #f5f5f5;
  position: relative; /* Importante para que el botón se ubique respecto a esto */
  padding-top: 50px; /* Para evitar que choque con la barra de estado */
`;

//Boton de Salida
export const BotonSalida = styled.TouchableOpacity`
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #c231ff; /* El color morado que tienes en la imagen */
  padding: 1px 2px;
  border-radius: 8px;
  z-index: 10; /* Asegura que esté por encima de otros elementos */
`
export const NormalTextSalida = styled.Text`
  color: #a4f500; /* El color verde lima de tu texto */
  font-weight: bold;
  font-size: 35px;
`;

// Contenedor principal que envuelve la info (debajo de "Perfil Usuario")
export const InfoSection = styled.View`
  margin-top: 30px;
  padding-horizontal: 20px;
  width: 100%;
`;

// Cada fila de información
export const InfoRow = styled.View`
  background-color: #ffffff;
  padding: 15px;
  border-radius: 12px;
  margin-bottom: 15px;
  flex-direction: row;
  align-items: center;
  /* Sombra suave para que resalte en el fondo gris */
  elevation: 2;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
`;

// Etiqueta (ej: "Nombre")
export const Label = styled.Text`
  font-size: 14px;
  color: #888;
  font-weight: bold;
  width: 80px; /* Ancho fijo para que los valores queden alineados */
`;

// Valor (ej: "Juan Pérez")
export const Value = styled.Text`
  font-size: 16px;
  color: #333;
  flex: 1;
`;

