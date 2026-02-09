import React, {createContext, useState} from "react";
export const UserContext = createContext<any>(null); //creando contexto que se usa para enviar datos, Inicio


export const UserProvider = ({children}:any) => { //Funcion/Componente que se usa para abarcar la aplicacion y se envien datos globales

    const [users, setUsers] = useState<any>([])//Datos a compartir;

    return(
        <UserContext.Provider value={{users, setUsers}}>
            {children}
        </UserContext.Provider>
    )
}