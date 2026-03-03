import { Text, View, TouchableOpacity } from "react-native";

import styled from "styled-components/native";

export const Container = styled.View`
  flex: 1;
  padding: 20px;
  background-color: #f4f7f6;
`;

export const InfoCard = styled.View`
  background-color: #fff;
  border-radius: 15px;
  padding: 20px;
  align-items: center;
  shadow-color: #000;
  shadow-opacity: 0.1;
  elevation: 4;
  margin-bottom: 20px;
`;

export const NavRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

export const IconButton = styled.TouchableOpacity`
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 50px;
`;

export const TableContainer = styled.View`
  background-color: #fff;
  border-radius: 10px;
  overflow: hidden;
  margin-top: 10px;
  border: 1px solid #ddd;
`;

// 1. Definimos qué props puede recibir el componente
interface TableRowProps {
  isHeader?: boolean; // El '?' significa que es opcional
}

export const TableRow = styled.View<TableRowProps>`
  flex-direction: row;
  border-bottom-width: 1px;
  border-bottom-color: #eee;
  padding: 12px;
  /* Especificamos el tipo dentro de la función de flecha */
  background-color: ${(props: TableRowProps) => (props.isHeader ? '#f8f9fa' : '#fff')};
`;

export const TableCell = styled.Text`
  flex: 1;
  text-align: center;
  font-size: 13px;  
  font-weight: ${(props: TableRowProps) => props.isHeader ? 'bold' : 'normal'};
  color: ${(props: TableRowProps) => props.isHeader ? '#333' : '#666'};
`;