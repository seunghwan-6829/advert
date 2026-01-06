'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
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
  const permissionCacheRef = useRef<Map<string, UserPermissions>>(new Map());
  const fetchingRef = useRef<Set<string>>(new Set());

  // 관리자 여부 확인
  const isAdmin = user ? ADMIN_EMAILS.includes(user.email || '') : false;

  // 유저 권한 가져오기 (캐시 사용)
  const fetchUserPermission = async (userId: string, email: string): Promise<UserPermissions | null> => {
    if (!supabase) return null;
    
    // 캐시 확인
    const cached = permissionCacheRef.current.get(userId);
    if (cached) return cached;
    
    // 이미 요청 중이면 대기
    if (fetchingRef.current.has(userId)) {
      return null;
    }
    
    fetchingRef.current.add(userId);
    
    try {
      // 기존 권한 확인
      const { data: existing, error: fetchError } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (existing && !fetchError) {
        const perms = {
          canCreatePlans: existing.can_create_plans || false,
          canViewProjects: existing.can_view_projects || false,
          allowedBrandIds: existing.allowed_brand_ids || [],
        };
        permissionCacheRef.current.set(userId, perms);
        return perms;
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
      
      const perms = {
        canCreatePlans: newData?.can_create_plans || false,
        canViewProjects: newData?.can_view_projects || false,
        allowedBrandIds: newData?.allowed_brand_ids || [],
      };
      permissionCacheRef.current.set(userId, perms);
      return perms;
    } catch (error) {
      console.error('Error in fetchUserPermission:', error);
      return null;
    } finally {
      fetchingRef.current.delete(userId);
    }
  };

  // 권한 새로고침 (캐시 무효화)
  const refreshPermissions = async () => {
    if (user && user.email) {
      permissionCacheRef.current.delete(user.id);
      const perms = await fetchUserPermission(user.id, user.email);
      setPermissions(perms);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setIsLoading(false);
      return;
    }

    let mounted = true;
    let initialized = false;

    // 현재 세션 확인 (최초 1회)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted || initialized) return;
      initialized = true;
      
      if (session?.user) {
        setUser(session.user);
        if (session.user.email) {
          const perms = await fetchUserPermission(session.user.id, session.user.email);
          if (mounted) setPermissions(perms);
        }
      }
      if (mounted) setIsLoading(false);
    });

    // 인증 상태 변경 구독 (로그인/로그아웃 시에만)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        // INITIAL_SESSION 이벤트는 무시 (getSession에서 처리)
        if (event === 'INITIAL_SESSION') return;
        
        if (session?.user) {
          setUser(session.user);
          if (session.user.email) {
            const perms = await fetchUserPermission(session.user.id, session.user.email);
            if (mounted) setPermissions(perms);
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

    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });
    setIsLoading(false);

    if (error) {
      return { error: error.message };
    }

    // 회원가입 성공 시 권한 레코드 생성 (onAuthStateChange에서 중복 호출되지 않도록)
    if (data.user) {
      const perms = await fetchUserPermission(data.user.id, email);
      setPermissions(perms);
    }

    return { error: null };
  };

  // 로그인
  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured() || !supabase) {
      return { error: 'Supabase가 설정되지 않았습니다.' };
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setIsLoading(false);

    if (error) {
      return { error: error.message };
    }

    // 로그인 성공 - onAuthStateChange에서 권한 처리됨
    return { error: null };
  };

  // 로그아웃
  const signOut = async () => {
    if (!isSupabaseConfigured() || !supabase) return;
    permissionCacheRef.current.clear();
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
