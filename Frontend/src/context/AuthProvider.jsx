import React, { createContext, useContext, useEffect, useState } from "react";
import * as api from "../api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // try auto-login on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await api.getUser();
        setUser(data.user);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const doLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      // ignore server errors, still clear local state
      console.error(err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, doLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
