import React from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "../lib/supabase";
import { apiRequest } from "../services/api";

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configurationError, setConfigurationError] = useState("");

  useEffect(() => {
    let isMounted = true;
    let subscription;

    async function initializeAuth() {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!isMounted) {
          return;
        }

        setSession(data.session);
        if (data.session) {
          await loadProfile(data.session, isMounted);
        }

        const authState = supabase.auth.onAuthStateChange((_event, nextSession) => {
          if (!isMounted) {
            return;
          }

          setSession(nextSession);
          if (!nextSession) {
            setProfile(null);
          }
        });

        subscription = authState.data.subscription;
      } catch (error) {
        if (isMounted) {
          setConfigurationError(error.message || "No se pudo iniciar la autenticación.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  async function loadProfile(currentSession = session, isMounted = true) {
    if (!currentSession?.access_token) {
      setProfile(null);
      return null;
    }

    try {
      const currentProfile = await apiRequest("/usuarios/me", {
        accessToken: currentSession.access_token,
      });

      if (isMounted) {
        setProfile(currentProfile);
      }

      return currentProfile;
    } catch (error) {
      if (isMounted) {
        setProfile(null);
      }
      throw error;
    }
  }

  async function signIn(email, password) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    setSession(data.session);
    if (data.session) {
      await loadProfile(data.session);
    }
    return data;
  }

  async function signUp({ email, password, nombreCompleto, idInstitucional }) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre_completo: nombreCompleto,
          id_institucional: idInstitucional,
        },
      },
    });

    if (error) {
      throw error;
    }

    setSession(data.session);
    if (data.session) {
      await loadProfile(data.session);
    }
    return data;
  }

  async function signOut() {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    setSession(null);
    setProfile(null);
  }

  async function resetPassword(email) {
    const supabase = getSupabaseClient();
    const redirectTo = `${window.location.origin}/login`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      throw error;
    }
  }

  const value = useMemo(
    () => ({
      session,
      profile,
      loading,
      configurationError,
      signIn,
      signUp,
      signOut,
      resetPassword,
      refreshProfile: () => loadProfile(),
    }),
    [configurationError, loading, profile, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe utilizarse dentro de AuthProvider.");
  }

  return context;
}

export { AuthProvider, useAuth };
