import { router } from "expo-router";
import { useContext } from 'react';
import { Button, Alert } from "react-native";
import { Container, Title } from "../../styles/homeStyles";
import { UserContext } from '../../components/UserContext'; 

//Importamos la función de salida que me acabas de mostrar
import { cerrarSesionUniversal } from '../../services/authgoogle'; 

export default function Home() {
  const { setUsers } = useContext(UserContext);


  return (
    <Container> 
      <Title>Página principal</Title>
    </Container>   
  );
}