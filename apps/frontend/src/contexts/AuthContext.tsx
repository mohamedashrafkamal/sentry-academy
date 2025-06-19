import React, { createContext, useState, useEffect } from "react";
import { User } from "../types";
import { authService } from "../services/authService";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  ssoLogin: (provider: string, loginSignature?: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for stored authentication
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("authToken");

    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Failed to parse stored user", error);
        localStorage.removeItem("user");
        localStorage.removeItem("authToken");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });

      setUser(response.user);
      setIsAuthenticated(true);
      localStorage.setItem("user", JSON.stringify(response.user));
      localStorage.setItem("authToken", response.token);

      console.log("Email/password login successful");
    } catch (error: any) {
      console.error("Login failed:", error);

      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("user");
      localStorage.removeItem("authToken");

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const ssoLogin = async (
    provider: string,
    loginSignature?: string
  ): Promise<void> => {
    setIsLoading(true);
    try {
      console.log("Initiating SSO login");
      console.log("Login signature provided:", !!loginSignature);

      // WORKSHOP SCENARIO: Call SSO endpoint - will fail if loginSignature is missing
      const response = await authService.ssoLogin(provider, {
        loginSignature: loginSignature, // This is undefined when not provided by frontend
        code: "mock-oauth-code",
        state: "mock-state",
      });

      console.log("SSO response received:", response);

      // If we get here, SSO login was successful
      setUser(response.user);
      setIsAuthenticated(true);
      localStorage.setItem("user", JSON.stringify(response.user));
      localStorage.setItem("authToken", response.token);

      console.log(`SSO login successful with ${provider}`);
    } catch (error: any) {
      console.error(`SSO login failed for ${provider}:`, error);

      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("user");
      localStorage.removeItem("authToken");

      // Re-throw to let the error bubble up
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (token) {
        await authService.logout(token);
      }
    } catch (error) {
      console.warn("Logout API call failed:", error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("user");
      localStorage.removeItem("authToken");
      console.log("User logged out");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        ssoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
