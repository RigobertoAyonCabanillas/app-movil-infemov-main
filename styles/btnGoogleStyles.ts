import styled from "styled-components/native";

// --- NUEVOS STYLED COMPONENTS ---

export const ContainerIcono = styled.View`
  align-items: center;
  justify-content: center;
  margin-top: 10px;
`;

export const BtnGoogleCircular = styled.TouchableOpacity`
  background-color: #ffffff;
  width: 55px;
  height: 55px;
  border-radius: 28px; /* Hace que sea un círculo perfecto */
  justify-content: center;
  align-items: center;
  
  /* Borde sutil */
  border-width: 1px;
  border-color: #e0e0e0;

  /* Sombra para que resalte del fondo blanco */
  elevation: 4;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.15;
  shadow-radius: 3.84px;
`;