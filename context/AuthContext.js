"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children, initialLoginState, initialUserInfo }) {
  const [isLoggedIn, setIsLoggedIn] = useState(initialLoginState);
  const [userInfo, setUserInfo] = useState(initialUserInfo);

  useEffect(() => {
    setIsLoggedIn(initialLoginState);
    setUserInfo(initialUserInfo);
  }, [initialLoginState, initialUserInfo]);

  const login = (info) => {
    setIsLoggedIn(true);
    if (info) setUserInfo(info);
  };
  
  const logout = async () => {
    setIsLoggedIn(false);
    setUserInfo(null);
    document.cookie = "isLoggedIn=; max-age=0; path=/";
    document.cookie = "userInfo=; max-age=0; path=/";
    try {
      await fetch("/api/v1/user/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      window.location.href = "/";
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, userInfo, login, logout, setIsLoggedIn, setUserInfo }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
