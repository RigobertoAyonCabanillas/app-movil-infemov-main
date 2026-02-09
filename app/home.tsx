import { router } from "expo-router";
import { Button } from "react-native";
import { Container, Title } from "../styles/homeStyles";

export default function Screen1() {
  
  return (
    
    <Container> 
        <Title>Pagina principal</Title>

         <Button title="Regresar" onPress={router.back}></Button>

    </Container>   
  );
}