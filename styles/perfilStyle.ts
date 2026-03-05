import { TextInput, TextInputProps, TouchableOpacity, Text, View } from "react-native";
import styled from "styled-components/native";

export const Title = styled.Text`
  color: #a0c224;
  font-size: 60px;
`;

export const TextSalir = styled.Text`
  color: #a0c224;
  font-size: 20px;
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
  top: 20px;   /* Aumenté esto porque 10px suele chocar con el notch/barra de estado */
  right: 30px;  /* Un margen un poco más generoso para que no pegue al borde */
  background-color: #9815d0;
  padding: 8px 15px; /* Padding real para que el botón sea presionable */
  border-radius: 8px;
  z-index: 9; /* Un valor alto para asegurar que esté por encima de todo */
  elevation: 5;  /* IMPORTANTE para Android, si no, el z-index a veces no basta */
`;
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

/* 1. Fondo oscurecido que cubre toda la pantalla al abrir el modal */
export const ModalContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5); /* Esto da el efecto de profundidad */
`;

/* Asegúrate de que el ModalContent tenga espacio suficiente */
export const ModalContent = styled.View`
  width: 85%;
  background-color: #ffffff;
  border-radius: 20px;
  padding: 25px;
  align-items: center;
  elevation: 5;
`;

export const InputModal = styled.TextInput`
  width: 100%;
  height: 50px;
  background-color: #f9f9f9;
  border-radius: 10px;
  border-width: 1px;
  border-color: #e0e0e0;
  padding-horizontal: 15px;
  margin-vertical: 8px; /* Cambié top por vertical para separar ambos inputs */
  font-size: 16px;
  color: #333;
`;
