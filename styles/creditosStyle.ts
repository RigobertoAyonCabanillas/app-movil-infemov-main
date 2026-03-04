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

interface TableRowProps {
  isHeader?: boolean;
}

interface TableCellProps {
  isHeader?: boolean;
  flexWeight?: number; // Para controlar el ancho de la columna
}

export const TableContainer = styled.View`
  background-color: #fff;
  border-radius: 12px;
  border: 1px solid #e1e4e8;
  overflow: hidden;
  width: 100%;
`;

export const TableRow = styled.View<TableRowProps>`
  flex-direction: row;
  padding: 12px 8px;
  background-color: ${(props: TableRowProps) => (props.isHeader ? '#f1f3f5' : '#ffffff')};
  border-bottom-width: 1px;
  border-bottom-color: #f1f3f5;
`;

export const TableCell = styled.Text<TableCellProps>`
  flex: ${(props: TableCellProps) => props.flexWeight || 1};
  text-align: center;
  font-size: 10px; /* Reducimos el tamaño para que quepan 5 columnas */
  color: ${(props: TableCellProps) => (props.isHeader ? '#495057' : '#212529')};
  font-weight: ${(props: TableCellProps) => (props.isHeader ? '700' : '400')};
`;