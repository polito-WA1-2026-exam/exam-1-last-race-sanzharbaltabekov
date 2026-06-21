import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import * as API from "../api.js";
import AuthContext from "./AuthContext.js";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const currentUser = await API.getCurrentUser();

        if (active) {
          setUser(currentUser);
        }
      } catch (err) {
        if (active && err.status !== 401) {
          console.error("Session restoration failed:", err);
        }
      } finally {
        if (active) {
          setAuthLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (username, password) => {
    const loggedUser = await API.login(username, password);
    setUser(loggedUser);

    return loggedUser;
  }, []);

  const logout = useCallback(async () => {
    await API.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      authLoading,
      login,
      logout,
    }),
    [user, authLoading, login, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}