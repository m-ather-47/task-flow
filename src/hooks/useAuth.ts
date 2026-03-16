"use client";

import { useAuthContext } from "@/contexts/AuthContext";
import { signInWithGoogle, signOut } from "@/lib/auth";
import { useRouter } from "next/navigation";

export function useAuth() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  const login = async () => {
    await signInWithGoogle();
    router.push("/dashboard");
  };

  const logout = async () => {
    await signOut();
    router.push("/");
  };

  return { user, loading, login, logout };
}
