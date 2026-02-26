// components/UserContext.tsx
import React, { createContext, useState } from "react";

export const UserContext = createContext<any>(null);

export const UserProvider = ({ children }: any) => {
  const [users, setUsers] = useState<any>(null);

  return (
    <UserContext.Provider value={{ users, setUsers }}>
      {children}
    </UserContext.Provider>
  );
};