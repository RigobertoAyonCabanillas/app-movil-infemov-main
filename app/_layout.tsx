import { Stack } from "expo-router";
import { UserProvider } from "../components/UserContext";


export default function Layout(){
    
    return(
        <UserProvider/* Acceso al componente UserContext para la informacion*/>
            <Stack>
                <Stack.Screen name="index" options={{title: "Login"}}/>
                <Stack.Screen name="register" options={{title: "Register"}}/>
                <Stack.Screen name="home" options={{title: "Home"}}/>
            </Stack>
        </UserProvider>
    );
}