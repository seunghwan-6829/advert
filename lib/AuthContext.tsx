'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);

  // 관리자 여부 확인
  const isAdmin = user ? ADMIN_EMAILS.includes(user.email || '') : false;

  // 유저 권한 레코드 생성 (없으면 생성)
  const ensureUserPermission = useCallback(async (userId: string, email: string) => {
    if (!supabase) return null;
    
    try {
      // 먼저 기존 권한 확인
      const { data: existing, error: fetchError } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (existing && !fetchError) {
        return {
          canCreatePlans: existing.can_create_plans || false,
          canViewProjects: existing.can_view_projects || false,
          allowedBrandIds: existing.allowed_brand_ids || [],
        };
      }
      
      // 없으면 새로 생성
      const now = new Date().toISOString();
      const { data: newData, error: insertError } = await supabase
        .from('user_permissions')
        .insert({
          user_id: userId,
          email: email,
          can_create_plans: false,
          can_view_projects: false,
          allowed_brand_ids: [],
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error creating user permission:', insertError);
        return null;
      }
      
      return {
        canCreatePlans: newData?.can_create_plans || false,
        canViewProjects: newData?.can_view_projects || false,
        allowedBrandIds: newData?.allowed_brand_ids || [],
      };
    } catch (error) {
      console.error('Error in ensureUserPermission:', error);
      return null;
    }
  }, []);

  // 권한 새로고침
  const refreshPermissions = useCallback(async () => {
    if (user && user.email) {
      const perms = await ensureUserPermission(user.id, user.email);
      setPermissions(perms);
    }
  }, [user, ensureUserPermission]);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setIsLoading(false);
      return;
    }

    let mounted = true;

    // 현재 세션 확인
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      
      setUser(session?.user ?? null);
      if (session?.user && session.user.email) {
        const perms = await ensureUserPermission(session.user.id, session.user.email);
        if (mounted) setPermissions(perms);
      }
      if (mounted) setIsLoading(false);
    });

    // 인증 상태 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        setUser(session?.user ?? null);
        if (session?.user && session.user.email) {
          // 회원가입이나 로그인 시 권한 레코드 확인/생성
          const perms = await ensureUserPermission(session.user.id, session.user.email);
          if (mounted) setPermissions(perms);
        } else {
          if (mounted) setPermissions(null);
        }
        if (mounted) setIsLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [ensureUserPermission]);

  // 회원가입
  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured() || !supabase) {
      return { error: 'Supabase가 설정되지 않았습니다.' };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });

    if (error) {
      return { error: error.message };
    }

    // 회원가입 성공 시 권한 레코드 바로 생성
    if (data.user) {
      await ensureUserPermission(data.user.id, email);
    }

    return { error: null };
  };

  // 로그인
  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured() || !supabase) {
      return { error: 'Supabase가 설정되지 않았습니다.' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    // 로그인 성공 시 권한 확인/생성
    if (data.user) {
      const perms = await ensureUserPermission(data.user.id, email);
      setPermissions(perms);
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
