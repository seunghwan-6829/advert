'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { User } from '@supabase/supabase-js';

// 관리자 이메일 목록
const ADMIN_EMAILS = ['motiol_6829@naver.com'];

// 유저 권한 타입
export interface UserPermissions {
  canCreatePlans: boolean;
  canViewProjects: boolean;
  allowedBrandIds: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  permissions: UserPermissions | null;
  refreshPermissions: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 기본 권한 (user_permissions 테이블이 없을 때 사용)
const DEFAULT_PERMISSIONS: UserPermissions = {
  canCreatePlans: true,
  canViewProjects: true,
  allowedBrandIds: [], // 빈 배열 = 전체 접근
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);

  // 관리자 여부 확인
  const isAdmin = user ? ADMIN_EMAILS.includes(user.email || '') : false;

  // 권한 새로고침 (현재는 기본값 사용)
  const refreshPermissions = async () => {
    if (user) {
      // 관리자는 모든 권한
      if (isAdmin) {
        setPermissions(DEFAULT_PERMISSIONS);
        return;
      }
      
      // 일반 유저도 기본 권한 부여 (user_permissions 테이블 없이 작동)
      setPermissions(DEFAULT_PERMISSIONS);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setIsLoading(false);
      return;
    }

    let mounted = true;

    // 현재 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      if (session?.user) {
        setUser(session.user);
        // 기본 권한 설정
        setPermissions(DEFAULT_PERMISSIONS);
      }
      setIsLoading(false);
    });

    // 인증 상태 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        // INITIAL_SESSION 이벤트는 무시
        if (event === 'INITIAL_SESSION') return;
        
        if (session?.user) {
          setUser(session.user);
          setPermissions(DEFAULT_PERMISSIONS);
        } else {
          setUser(null);
          setPermissions(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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
    setPermissions(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isAdmin, 
      permissions, 
      refreshPermissions,
      signUp, 
      signIn, 
      signOut 
    }}>
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
