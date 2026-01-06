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

// 기본 권한 (에러 시 또는 권한 없을 때)
const DEFAULT_PERMISSIONS: UserPermissions = {
  canCreatePlans: false,
  canViewProjects: false,
  allowedBrandIds: [],
};

// 타임아웃 Promise
const timeout = (ms: number) => new Promise((_, reject) => 
  setTimeout(() => reject(new Error('timeout')), ms)
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);

  // 관리자 여부 확인
  const isAdmin = user ? ADMIN_EMAILS.includes(user.email || '') : false;

  // 유저 권한 가져오기 (타임아웃 2초)
  const fetchPermissions = async (userId: string): Promise<UserPermissions> => {
    if (!supabase) return DEFAULT_PERMISSIONS;
    
    try {
      const result = await Promise.race([
        supabase
          .from('user_permissions')
          .select('*')
          .eq('user_id', userId)
          .single(),
        timeout(2000)
      ]) as { data: { can_create_plans: boolean; can_view_projects: boolean; allowed_brand_ids: string[] } | null; error: unknown };
      
      if (result.error || !result.data) {
        return DEFAULT_PERMISSIONS;
      }
      
      return {
        canCreatePlans: result.data.can_create_plans ?? false,
        canViewProjects: result.data.can_view_projects ?? false,
        allowedBrandIds: result.data.allowed_brand_ids ?? [],
      };
    } catch {
      return DEFAULT_PERMISSIONS;
    }
  };

  // 권한 생성 (없을 때만 - 기존 권한 덮어쓰지 않음!)
  const createPermissionIfNotExists = async (userId: string, email: string): Promise<void> => {
    if (!supabase) return;
    
    try {
      // 먼저 기존 권한이 있는지 확인
      const { data: existing } = await supabase
        .from('user_permissions')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      // 이미 있으면 생성하지 않음
      if (existing) return;
      
      // 없을 때만 새로 생성
      await supabase
        .from('user_permissions')
        .insert({
          user_id: userId,
          email: email,
          can_create_plans: false,
          can_view_projects: false,
          allowed_brand_ids: [],
        });
    } catch {
      // 무시 (이미 존재하거나 에러)
    }
  };

  // 권한 새로고침
  const refreshPermissions = async () => {
    if (!user) return;
    
    if (isAdmin) {
      setPermissions({
        canCreatePlans: true,
        canViewProjects: true,
        allowedBrandIds: [],
      });
      return;
    }
    
    const perms = await fetchPermissions(user.id);
    setPermissions(perms);
  };

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setIsLoading(false);
      return;
    }

    let mounted = true;

    // 현재 세션 확인
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      
      if (session?.user) {
        setUser(session.user);
        
        // 관리자는 모든 권한
        if (ADMIN_EMAILS.includes(session.user.email || '')) {
          setPermissions({
            canCreatePlans: true,
            canViewProjects: true,
            allowedBrandIds: [],
          });
        } else {
          // 일반 유저 권한 조회
          const perms = await fetchPermissions(session.user.id);
          if (mounted) setPermissions(perms);
          
          // 권한 레코드 없으면 생성 (기존 권한 덮어쓰지 않음)
          if (session.user.email) {
            createPermissionIfNotExists(session.user.id, session.user.email);
          }
        }
      }
      
      if (mounted) setIsLoading(false);
    });

    // 인증 상태 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        if (event === 'INITIAL_SESSION') return;
        
        if (session?.user) {
          setUser(session.user);
          
          if (ADMIN_EMAILS.includes(session.user.email || '')) {
            setPermissions({
              canCreatePlans: true,
              canViewProjects: true,
              allowedBrandIds: [],
            });
          } else {
            const perms = await fetchPermissions(session.user.id);
            if (mounted) setPermissions(perms);
            
            if (session.user.email) {
              createPermissionIfNotExists(session.user.id, session.user.email);
            }
          }
        } else {
          setUser(null);
          setPermissions(null);
        }
        
        if (mounted) setIsLoading(false);
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

    return { error: error?.message || null };
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

    return { error: error?.message || null };
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
