import { router } from "expo-router";
import { useContext, useState, useCallback } from 'react';
import { Button, Alert, View, Text } from "react-native";
import { Container, InfoCard, NavRow, IconButton, TableContainer, TableRow, TableCell } from "@/styles/creditosStyle";
import { UserContext } from '../../components/UserContext'; 
import { useFocusEffect } from 'expo-router'; // o 'react-navigation/native'


//Importamos la función de salida que me acabas de mostrar
import { cerrarSesionUniversal } from '../../services/authgoogle'; 
import { Ionicons } from "@expo/vector-icons";

export default function Creditos() {
  
    const [index, setIndex] = useState(0);// Para controlar cuál info mostrar
    const [creditos, setCreditos] = useState(0);
    const [tipo, setTipo] = useState("");

    // Datos para el "carrusel"
    const infoSesion = [
        { nombre: "Créditos de Día", valor: 5 },
        { nombre: "Mensualidad Restante", valor: 12 }
    ];

    // 2. Definir la función fuera de los hooks para que el botón la vea
    const alternarInfo = () => {
        setIndex((prevIndex) => (prevIndex === 0 ? 1 : 0));//"¿El índice actual es 0? Si sí, cámbialo a 1. Si no, cámbialo a 0.
    };
    
    useFocusEffect(
        useCallback(() => { 

            // Aquí puedes cargar datos de Firebase/MongoDB si es necesario
            console.log("Pantalla en foco, cargando datos...");
        },[])
);



  return (
    <Container>
      <InfoCard>
        <NavRow>
          <IconButton onPress={alternarInfo}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </IconButton>

          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 16, color: '#888' }}>
              {index === 0 ? "RESUMEN CRÉDITOS" : "ESTADO MEMBRESÍA"}
            </Text>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#333' }}>
              {index === 0 ? "12 Pts" : "Activa"}
            </Text>
          </View>

          <IconButton onPress={alternarInfo}>
            <Ionicons name="chevron-forward" size={24} color="#007AFF" />
          </IconButton>
        </NavRow>
      </InfoCard>

      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Historial Detallado
      </Text>

      {index === 0 ? (
        /* TABLA DE CRÉDITOS */
        <TableContainer>
          <TableRow isHeader>
            <TableCell isHeader>Fecha</TableCell>
            <TableCell isHeader>Movimiento</TableCell>
            <TableCell isHeader>Cantidad</TableCell>
          </TableRow>
          {/* Aquí mapearás los datos de SQLite con Drizzle más adelante */}
          <TableRow>
            <TableCell>02/03</TableCell>
            <TableCell>Consumo</TableCell>
            <TableCell>-2</TableCell>
          </TableRow>
        </TableContainer>
      ) : (
        /* TABLA DE MEMBRESÍAS */
        <TableContainer>
          <TableRow isHeader>
            <TableCell isHeader>Plan</TableCell>
            <TableCell isHeader>Vencimiento</TableCell>
            <TableCell isHeader>Estatus</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Mensual</TableCell>
            <TableCell>30/03/26</TableCell>
            <TableCell style={{ color: 'green' }}>Pagado</TableCell>
          </TableRow>
        </TableContainer>
      )}
    </Container>
  );
}