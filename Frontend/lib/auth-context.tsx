// Frontend\lib\auth-context.tsx - AuthProvider + useAuth() hook (user, loading, signup, login, logout)

// Frontend\lib\auth-context.tsx - AuthProvider + useAuth() hook (user, loading, signup, login, logout)

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  type User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";

import { auth } from "./firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signup = async (name: string, email: string, password: string) => {
    setError("");
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      await updateProfile(credential.user, { displayName: name });

      // updateProfile mutates the same user object in place, but React
      // won't re-render from that alone — push a fresh reference so any
      // already-mounted consumers pick up the new displayName immediately.
      setUser({ ...credential.user } as User);
    } catch (err) {
      setError(mapAuthError(err));
      throw err;
    }
  };

  const login = async (email: string, password: string) => {
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(mapAuthError(err));
      throw err;
    }
  };

  const logout = async () => {
    setError("");
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, error, signup, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

function mapAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    default:
      return "Something went wrong. Please try again.";
  }
}
