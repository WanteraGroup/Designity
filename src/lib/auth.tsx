import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { AppRole, PlanId, UserProfile } from '@/types';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  authKnown: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isUnlimited: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authKnown, setAuthKnown] = useState(false);

  const loadProfile = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role, plan_id, credits, unlimited_access, full_name, avatar_url, phone, created_at')
      .eq('id', uid)
      .maybeSingle();

    if (error) {
      console.error('Failed to load profile:', error.message);
      return;
    }

    if (data) {
      setProfile(data as UserProfile);
    } else {
      const fallback: UserProfile = {
        id: uid,
        email: '',
        role: 'user',
        plan_id: 'free',
        credits: 10,
        unlimited_access: false,
        full_name: null,
        avatar_url: null,
        phone: null,
        created_at: new Date().toISOString(),
      };
      setProfile(fallback);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let initialHandled = false;

    const applySession = async (newSession: Session | null) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        // Ownership is a server-owned property of the profile row. The client
        // reads it, it never asserts it — so there is no email literal and no
        // elevation call here.
        await loadProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
      setAuthKnown(true);
    };

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted || initialHandled) return;
      initialHandled = true;
      applySession(data.session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'INITIAL_SESSION') {
        if (initialHandled) return;
        initialHandled = true;
      }
      applySession(newSession);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return { error: error.message };
    if (data.user) {
      await loadProfile(data.user.id);
    }
    return { error: null };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const isOwner = profile?.role === 'owner';
  const isAdmin = isOwner || profile?.role === 'admin';
  const isUnlimited = isOwner || profile?.unlimited_access === true;

  return (
    <AuthContext.Provider value={{
      session, user, profile, loading, authKnown, isOwner, isAdmin, isUnlimited,
      signUp, signIn, signOut, resetPassword, updatePassword, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useCredits() {
  const { profile, isUnlimited, isOwner, refreshProfile } = useAuth();
  const credits = isUnlimited ? Infinity : (profile?.credits ?? 0);
  return { credits, refreshProfile, isOwner };
}

export function planIdToString(planId: PlanId | undefined): string {
  return planId || 'free';
}

export function roleToString(role: AppRole | undefined): string {
  return role || 'user';
}
