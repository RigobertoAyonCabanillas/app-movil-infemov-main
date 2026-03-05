import { router } from "expo-router";
import { useContext, useState, useCallback } from 'react';
import { Button, Alert, View, Text } from "react-native";
import { Container, InfoCard, NavRow, IconButton, TableContainer, TableRow, TableCell } from "@/styles/creditosStyle";
import { UserContext } from '../../components/UserContext'; 
import { useFocusEffect } from 'expo-router'; // o 'react-navigation/native'
import { Ionicons } from "@expo/vector-icons";
import { useAuthService } from "@/servicesdb/authService"; // Importamos tu servicio central
import * as schema from '@/db/schema';
import { InferSelectModel } from 'drizzle-orm';

export default function Creditos() {
    const [index, setIndex] = useState(0);
    // ... dentro de tu componente Creditos
    // Dile a useState que este arreglo es de tipo 'Membresia'
    const [listaMembresias, setListaMembresias] = useState<Membresia[]>([]);
    type Membresia = InferSelectModel<typeof schema.membresiasdb>;

    // Ahora para 'Creditos'
    const [listaCreditos, setListaCreditos] = useState<Credito[]>([]);
    type Credito = InferSelectModel<typeof schema.creditosdb>;
    
        
    // Extraemos la función que agregamos a tu servicio
    const { obtenerMembresiasLocal, insertarMembresiaTest, obtenerCreditosLocal, insertarCreditoTest } = useAuthService();

    const alternarInfo = () => {    
        setIndex((prevIndex) => (prevIndex === 0 ? 1 : 0));
    };
    
    // Carga de datos reactiva al foco de la pestaña
      useFocusEffect(
      useCallback(() => {
        let isMounted = true; // Para evitar actualizaciones en componentes desmontados

    const sincronizarTodo = async () => {
      try {
        console.log("🔵 Iniciando sincronización única...");

        // 1. Manejo de Membresías
        const resMembresias = await obtenerMembresiasLocal();
        if (isMounted) {
          if (resMembresias.length === 0) {
            await insertarMembresiaTest();
            const nuevasM = await obtenerMembresiasLocal();
            setListaMembresias(nuevasM);
          } else {
            setListaMembresias(resMembresias);
          }
        }

        // 2. Manejo de Créditos (Con captura de error específica)
        try {
          const resCreditos = await obtenerCreditosLocal();
          if (isMounted) {
            if (resCreditos.length === 0) {
              await insertarCreditoTest();
              const nuevosC = await obtenerCreditosLocal();
              setListaCreditos(nuevosC);
            } else {
              setListaCreditos(resCreditos);
            }
          }
        } catch (creditError) {
          console.error("⚠️ La tabla de créditos falló. Verifica el esquema o si la tabla existe en la DB root.");
        }

      } catch (error) {
        console.error("❌ Error general de sincronización:", error);
      }
    };

    sincronizarTodo();

    return () => {
      isMounted = false; // Limpieza al salir de la pestaña
    };
  }, []) // 👈 IMPORTANTE: Vacío para romper el bucle infinito
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
              {/* Aquí podrías mapear el valor real del primer registro si quisieras */}
              {index === 0 ? "---" : (listaMembresias.length > 0 ? "---" : "S/N")}
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
        /* TABLA DE CRÉDITOS  */
        <TableContainer>
        <TableRow isHeader>
          <TableCell isHeader>Folio</TableCell>
          <TableCell isHeader>Paquete</TableCell>
          <TableCell isHeader>Tipo</TableCell>
          <TableCell isHeader>Pago</TableCell>
          <TableCell isHeader>Expira</TableCell>
          <TableCell isHeader>Estatus</TableCell>
        </TableRow>
        
        {listaCreditos.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.folioCredito}</TableCell>
            <TableCell>{item.paquete}</TableCell>
            <TableCell>{item.tipo}</TableCell>
            <TableCell>{item.fechaPago}</TableCell>
            <TableCell>{item.fechaExpiracion}</TableCell>
            <TableCell style={{ color: item.estatus === 1 ? 'green' : 'orange' }}>
              {item.estatus === 1 ? 'Disponible' : 'Agotado'}
            </TableCell>
          </TableRow>
        ))}
      </TableContainer>
      ) : (
        /* TABLA DE MEMBRESÍAS */
        <TableContainer>
          <TableRow isHeader>
            <TableCell isHeader>Folio</TableCell>
            <TableCell isHeader>Tipo</TableCell>
            <TableCell isHeader>Inicio</TableCell>
            <TableCell isHeader>Vence</TableCell>
            <TableCell isHeader>Estatus</TableCell>
          </TableRow>

          {/* MAPEADO DE DATOS DE SQLITE */}
          {listaMembresias.length > 0 ? (
            listaMembresias.map((item) => (
                <TableRow key={item.id}>
                    <TableCell>{item.folio || "N/A"}</TableCell>
                    <TableCell>{item.tipo || "S/P"}</TableCell>
                    <TableCell>{item.fechaInicio || "--/--"}</TableCell>
                    <TableCell>{item.fechaFin || "--/--"}</TableCell>
                    <TableCell style={{ color: item.status === 1 ? 'green' : 'red' }}>
                        {item.status === 1 ? 'Activo' : 'Vencido'}
                    </TableCell>
                </TableRow>
            ))
          ) : (
            <TableRow>
                <TableCell style={{ flex: 1, textAlign: 'center' }}>No hay registros en el móvil</TableCell>
            </TableRow>
          )}
        </TableContainer>
      )}
    </Container>
  );
}