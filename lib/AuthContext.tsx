'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { User } from '@supabase/supabase-js';

// 관리자 이메일 목록
const ADMIN_EMAILS = ['motiol_6829@naver.com'];

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 관리자 여부 확인
  const isAdmin = user ? ADMIN_EMAILS.includes(user.email || '') : false;

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setIsLoading(false);
      return;
    }

    // 현재 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // 인증 상태 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // 회원가입
  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured() || !supabase) {
      return { error: 'Supabase가 설정되지 않았습니다.' };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  };

  // 로그인
  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured() || !supabase) {
      return { error: 'Supabase가 설정되지 않았습니다.' };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  };

  // 로그아웃
  const signOut = async () => {
    if (!isSupabaseConfigured() || !supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

