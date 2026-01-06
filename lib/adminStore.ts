import { supabase, isSupabaseConfigured } from './supabase';
import { v4 as uuidv4 } from 'uuid';

// 유저 권한 타입
export interface UserPermission {
  id: string;
  userId: string;
  email: string;
  canCreatePlans: boolean;
  canViewProjects: boolean;
  allowedBrandIds: string[];
  createdAt: string;
  updatedAt: string;
}

// 방문 기록 타입
export interface VisitLog {
  id: string;
  userId: string;
  userEmail: string;
  visitedAt: string;
  page: string;
}

const PERMISSIONS_STORAGE_KEY = 'advert_user_permissions';
const VISITS_STORAGE_KEY = 'advert_visits';

// ==================== 유저 권한 관리 ====================

// 로컬 스토리지에서 권한 불러오기
const getLocalPermissions = (): UserPermission[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

// 로컬 스토리지에 권한 저장
const setLocalPermissions = (permissions: UserPermission[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(permissions));
};

// 모든 유저 권한 가져오기
export const getAllUserPermissions = async (): Promise<UserPermission[]> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data?.map(p => ({
        id: p.id,
        userId: p.user_id,
        email: p.email,
        canCreatePlans: p.can_create_plans || false,
        canViewProjects: p.can_view_projects || false,
        allowedBrandIds: p.allowed_brand_ids || [],
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      })) || [];
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return getLocalPermissions();
    }
  }
  return getLocalPermissions();
};

// 특정 유저 권한 가져오기
export const getUserPermission = async (userId: string): Promise<UserPermission | null> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) return null;
      
      return {
        id: data.id,
        userId: data.user_id,
        email: data.email,
        canCreatePlans: data.can_create_plans || false,
        canViewProjects: data.can_view_projects || false,
        allowedBrandIds: data.allowed_brand_ids || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch {
      return null;
    }
  }
  const permissions = getLocalPermissions();
  return permissions.find(p => p.userId === userId) || null;
};

// 유저 권한 생성/업데이트
export const upsertUserPermission = async (
  userId: string,
  email: string,
  updates: {
    canCreatePlans?: boolean;
    canViewProjects?: boolean;
    allowedBrandIds?: string[];
  }
): Promise<void> => {
  const now = new Date().toISOString();
  
  if (isSupabaseConfigured() && supabase) {
    // 먼저 기존 권한이 있는지 확인
    const { data: existing } = await supabase
      .from('user_permissions')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (existing) {
      // 업데이트
      await supabase
        .from('user_permissions')
        .update({
          can_create_plans: updates.canCreatePlans,
          can_view_projects: updates.canViewProjects,
          allowed_brand_ids: updates.allowedBrandIds,
          updated_at: now,
        })
        .eq('user_id', userId);
    } else {
      // 새로 생성
      await supabase
        .from('user_permissions')
        .insert({
          user_id: userId,
          email: email,
          can_create_plans: updates.canCreatePlans ?? false,
          can_view_projects: updates.canViewProjects ?? false,
          allowed_brand_ids: updates.allowedBrandIds ?? [],
          created_at: now,
          updated_at: now,
        });
    }
  } else {
    // 로컬 스토리지
    const permissions = getLocalPermissions();
    const index = permissions.findIndex(p => p.userId === userId);
    
    if (index !== -1) {
      permissions[index] = {
        ...permissions[index],
        ...updates,
        updatedAt: now,
      };
    } else {
      permissions.push({
        id: uuidv4(),
        userId,
        email,
        canCreatePlans: updates.canCreatePlans ?? false,
        canViewProjects: updates.canViewProjects ?? false,
        allowedBrandIds: updates.allowedBrandIds ?? [],
        createdAt: now,
        updatedAt: now,
      });
    }
    setLocalPermissions(permissions);
  }
};

// 유저 권한 삭제
export const deleteUserPermission = async (userId: string): Promise<void> => {
  if (isSupabaseConfigured() && supabase) {
    await supabase
      .from('user_permissions')
      .delete()
      .eq('user_id', userId);
  } else {
    const permissions = getLocalPermissions();
    const filtered = permissions.filter(p => p.userId !== userId);
    setLocalPermissions(filtered);
  }
};

// ==================== 방문 통계 ====================

// 로컬 스토리지에서 방문 기록 불러오기
const getLocalVisits = (): VisitLog[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(VISITS_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

// 로컬 스토리지에 방문 기록 저장
const setLocalVisits = (visits: VisitLog[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(VISITS_STORAGE_KEY, JSON.stringify(visits));
};

// 방문 기록 추가
export const logVisit = async (userId: string, userEmail: string, page: string): Promise<void> => {
  const visit: VisitLog = {
    id: uuidv4(),
    userId,
    userEmail,
    visitedAt: new Date().toISOString(),
    page,
  };

  if (isSupabaseConfigured() && supabase) {
    await supabase
      .from('visit_logs')
      .insert({
        id: visit.id,
        user_id: visit.userId,
        user_email: visit.userEmail,
        visited_at: visit.visitedAt,
        page: visit.page,
      });
  } else {
    const visits = getLocalVisits();
    setLocalVisits([visit, ...visits]);
  }
};

// 방문 기록 가져오기
export const getVisitLogs = async (days: number = 30): Promise<VisitLog[]> => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('visit_logs')
      .select('*')
      .gte('visited_at', startDate.toISOString())
      .order('visited_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching visits:', error);
      return getLocalVisits();
    }
    
    return data?.map(v => ({
      id: v.id,
      userId: v.user_id,
      userEmail: v.user_email,
      visitedAt: v.visited_at,
      page: v.page,
    })) || [];
  }
  
  return getLocalVisits().filter(v => new Date(v.visitedAt) >= startDate);
};

// 일별 방문 통계
export const getDailyVisitStats = async (days: number = 7): Promise<{ date: string; count: number }[]> => {
  const visits = await getVisitLogs(days);
  const stats: Record<string, number> = {};
  
  // 날짜별로 집계
  visits.forEach(v => {
    const date = v.visitedAt.split('T')[0];
    stats[date] = (stats[date] || 0) + 1;
  });
  
  // 최근 N일 날짜 생성
  const result: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    result.push({
      date: dateStr,
      count: stats[dateStr] || 0,
    });
  }
  
  return result;
};

// 고유 방문자 수
export const getUniqueVisitors = async (days: number = 30): Promise<number> => {
  const visits = await getVisitLogs(days);
  const uniqueUsers = new Set(visits.map(v => v.userId));
  return uniqueUsers.size;
};
