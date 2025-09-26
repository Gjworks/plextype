"use client";

import React, { createContext, useContext } from "react";
import { useUser } from "@plextype/hooks/auth/useAuth";

interface UserContextValue {
  user: any | null;
  isLoading: boolean;
  isError: boolean;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  isLoading: true,
  isError: false,
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: user, isLoading, isError } = useUser();

  return (
    <UserContext.Provider value={{ user, isLoading, isError }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);