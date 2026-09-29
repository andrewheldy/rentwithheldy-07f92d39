import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

const missingConfigurationError = new Error(
  "Authentication is unavailable because Supabase is not configured.",
);

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  /** Has the consigner role: a vehicle owner an admin linked to a car. */
  isConsigner: boolean;
  isLoading: boolean;
  /** True once isAdmin reflects the current user (false while their roles load after sign-in). */
  rolesLoaded: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: (redirectPath?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const noRoles = { admin: false, consigner: false };
const checkRoles = async (userId: string) => {
  try {
    const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);

    if (error) {
      console.error("Error checking roles:", error);
      return noRoles;
    }

    const roles = new Set((data ?? []).map((row) => row.role));
    return { admin: roles.has("admin"), consigner: roles.has("consigner") };
  } catch (error) {
    console.error("Error checking roles:", error);
    return noRoles;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isConsigner, setIsConsigner] = useState(false);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  // Which user isAdmin was last resolved for. Sign-in sets `user` right away,
  // but the role check finishes a moment later.
  const [rolesUserId, setRolesUserId] = useState<string | null>(null);

  const applyRoles = (userId: string, roles: { admin: boolean; consigner: boolean }) => {
    setIsAdmin(roles.admin);
    setIsConsigner(roles.consigner);
    setRolesUserId(userId);
  };

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use setTimeout to avoid potential Supabase deadlock
          setTimeout(async () => {
            applyRoles(session.user.id, await checkRoles(session.user.id));
            setIsLoading(false);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsConsigner(false);
          setRolesUserId(null);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        applyRoles(session.user.id, await checkRoles(session.user.id));
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) return { error: missingConfigurationError };

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured) return { error: missingConfigurationError };

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error as Error | null };
  };

  // OAuth is a full-page redirect: Supabase sends the browser to Google and
  // back to `redirectPath` on this origin, so no error surfaces here unless
  // the redirect itself fails to start.
  const signInWithGoogle = async (redirectPath: string = "/profile") => {
    if (!isSupabaseConfigured) return { error: missingConfigurationError };

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${redirectPath}`,
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setIsConsigner(false);
    setRolesUserId(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAdmin,
        isConsigner,
        isLoading,
        rolesLoaded: !user || rolesUserId === user.id,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
