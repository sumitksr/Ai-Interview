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

  useEffect(() => {
    // Automatically sync NextAuth OAuth session (Google/GitHub) so access & refresh tokens are set
    async function syncOAuthSession() {
      try {
        const res = await fetch("/api/auth/session-sync");
        if (res.ok) {
          const data = await res.json();
          if (data.ok) {
            setIsLoggedIn(true);
            setUserInfo(data.userInfo || { name: data.name, image: data.image, role: data.role });
          }
        }
      } catch (err) {
        // Silently fall back if not using OAuth
      }
    }
    syncOAuthSession();
  }, []);

  useEffect(() => {
    // Setup global fetch interceptor for auto-refreshing tokens
    const originalFetch = window.fetch;
    let isRefreshing = false;
    let refreshSubscribers = [];

    const onRefreshed = (err) => {
      refreshSubscribers.map((cb) => cb(err));
      refreshSubscribers = [];
    };

    window.fetch = async (...args) => {
      let response = await originalFetch(...args);
      
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
      // If unauthorized and we're not calling auth-related endpoints directly
      if (
        response.status === 401 &&
        url &&
        !url.includes('/api/v1/user/refresh') &&
        !url.includes('/api/v1/user/login') &&
        !url.includes('/api/v1/user/logout') &&
        !url.includes('/api/auth/session-sync')
      ) {
        
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const refreshRes = await originalFetch("/api/v1/user/refresh", { method: "POST" });
            if (refreshRes.ok) {
              isRefreshing = false;
              onRefreshed(null);
              // Retry the original request
              return originalFetch(...args);
            } else {
              isRefreshing = false;
              onRefreshed(new Error("Refresh failed"));
              // Optional: You could trigger logout here if desired
              return response; 
            }
          } catch (err) {
            isRefreshing = false;
            onRefreshed(err);
            return response;
          }
        } else {
          // Wait for the ongoing refresh to finish
          return new Promise((resolve) => {
            refreshSubscribers.push((err) => {
              if (err) resolve(response);
              else resolve(originalFetch(...args));
            });
          });
        }
      }
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);


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
