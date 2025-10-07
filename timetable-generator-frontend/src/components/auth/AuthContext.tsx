import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

export type UserRole = "admin" | "faculty" | "student";

export interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  role: UserRole | null;
  userEmail: string | null;
}

export interface AuthContextValue extends AuthState {
  login: (params: {
    email: string;
    password: string;
    role?: UserRole;
  }) => Promise<void>;
  signup: (params: {
    email: string;
    password: string;
    role?: UserRole;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    role: null,
    userEmail: null,
  });

  const login = useCallback(
    async ({
      email,
      password,
      role,
    }: {
      email: string;
      password: string;
      role?: UserRole;
    }) => {
      // Placeholder: integrate with API returning tokens and role
      // const res = await api.post('/auth/login', { email, password })
      // const { accessToken, refreshToken, role } = res.data
      await new Promise((r) => setTimeout(r, 300));
      setState({
        isAuthenticated: true,
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
        role: role ?? "student",
        userEmail: email,
      });
    },
    []
  );

  const signup = useCallback(
    async ({
      email,
      password,
      role,
    }: {
      email: string;
      password: string;
      role?: UserRole;
    }) => {
      // Placeholder: integrate with API then auto-login
      await new Promise((r) => setTimeout(r, 300));
      setState({
        isAuthenticated: true,
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
        role: role ?? "student",
        userEmail: email,
      });
    },
    []
  );

  const logout = useCallback(() => {
    setState({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      role: null,
      userEmail: null,
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      signup,
      logout,
    }),
    [state, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
