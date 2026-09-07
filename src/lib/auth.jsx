import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      setReady(true);
      return;
    }
    let cancelled = false;
    api
      .me()
      .then(({ user }) => !cancelled && setUser(user))
      .catch(() => setToken(null))
      .finally(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const adopt = useCallback(({ token, user }) => {
    setToken(token);
    setUser(user);
    return user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      signIn: async (email, password) => adopt(await api.login(email, password)),
      signUp: async (email, password) => adopt(await api.register(email, password)),
      // The server retires every older session, so the reply carries a fresh
      // token for this device; adopting it keeps the current tab signed in.
      changePassword: async (currentPassword, newPassword) =>
        adopt(await api.changePassword(currentPassword, newPassword)),
      signOut: () => {
        setToken(null);
        setUser(null);
      },
    }),
    [user, ready, adopt],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
