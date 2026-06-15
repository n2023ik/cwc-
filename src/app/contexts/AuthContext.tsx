import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";

interface AuthUser {
  token: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string, email?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Auth Loading");
    const savedUser = localStorage.getItem("auth_user");
    const isAuth = localStorage.getItem("isAuthenticated");

    if (savedUser && isAuth === "true") {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
      console.log("Session Restored");
    } else {
      console.log("No session found");
    }

    setLoading(false);
    console.log("Auth Ready");
  }, []);

  const login = useCallback((token: string, email: string = "") => {
    console.log("Auth login started");
    const newUser = { token, email };
    localStorage.setItem("auth_user", JSON.stringify(newUser));
    localStorage.setItem("isAuthenticated", "true");
    setUser(newUser);
    setIsAuthenticated(true);
    console.log("Auth login state updated");
  }, []);

  const logout = useCallback(() => {
    console.log("User logged out");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("isAuthenticated");
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
