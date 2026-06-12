"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children, initialLoginState }) {
  const [isLoggedIn, setIsLoggedIn] = useState(initialLoginState);

  useEffect(() => {
    setIsLoggedIn(initialLoginState);
  }, [initialLoginState]);

  const login = () => setIsLoggedIn(true);
  
  const logout = async () => {
    setIsLoggedIn(false);
    document.cookie = "isLoggedIn=; max-age=0; path=/";
    try {
      await fetch("/api/v1/user/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      window.location.href = "/";
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout, setIsLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
