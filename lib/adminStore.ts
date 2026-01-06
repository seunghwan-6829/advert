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
  visitorId: string;
  userEmail: string;
  visitedAt: string;
  page: string;
}

const VISITS_STORAGE_KEY = 'advert_visits';

// ==================== 유저 권한 관리 (Supabase) ====================

// 모든 유저 권한 가져오기
export const getAllUserPermissions = async (): Promise<UserPermission[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  
  try {
    const { data, error } = await supabase
      .from('user_permissions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    
    return data.map(p => ({
      id: p.id,
      userId: p.user_id,
      email: p.email,
      canCreatePlans: p.can_create_plans ?? false,
      canViewProjects: p.can_view_projects ?? false,
      allowedBrandIds: p.allowed_brand_ids ?? [],
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));
  } catch {
    return [];
  }
};

// 유저 권한 업데이트
export const updateUserPermission = async (
  userId: string,
  updates: {
    canCreatePlans?: boolean;
    canViewProjects?: boolean;
    allowedBrandIds?: string[];
  }
): Promise<boolean> => {
  if (!isSupabaseConfigured() || !supabase) return false;
  
  try {
    const { error } = await supabase
      .from('user_permissions')
      .update({
        can_create_plans: updates.canCreatePlans,
        can_view_projects: updates.canViewProjects,
        allowed_brand_ids: updates.allowedBrandIds,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
    
    return !error;
  } catch {
    return false;
  }
};

// 유저 권한 삭제
export const deleteUserPermission = async (userId: string): Promise<boolean> => {
  if (!isSupabaseConfigured() || !supabase) return false;
  
  try {
    const { error } = await supabase
      .from('user_permissions')
      .delete()
      .eq('user_id', userId);
    
    return !error;
  } catch {
    return false;
  }
};

// ==================== 방문 통계 (로컬 스토리지) ====================

const getLocalVisits = (): VisitLog[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(VISITS_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const setLocalVisits = (visits: VisitLog[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(VISITS_STORAGE_KEY, JSON.stringify(visits));
};

export const logVisit = async (visitorId: string, userEmail: string, page: string): Promise<void> => {
  const visit: VisitLog = {
    id: uuidv4(),
    visitorId,
    userEmail,
    visitedAt: new Date().toISOString(),
    page,
  };
  const visits = getLocalVisits();
  setLocalVisits([visit, ...visits.slice(0, 999)]);
};

export const getVisitLogs = async (days: number = 30): Promise<VisitLog[]> => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  return getLocalVisits().filter(v => new Date(v.visitedAt) >= startDate);
};

export const getDailyVisitStats = async (days: number = 7): Promise<{ date: string; count: number }[]> => {
  const visits = await getVisitLogs(days);
  const stats: Record<string, number> = {};
  
  visits.forEach(v => {
    const date = v.visitedAt.split('T')[0];
    stats[date] = (stats[date] || 0) + 1;
  });
  
  const result: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    result.push({ date: dateStr, count: stats[dateStr] || 0 });
  }
  
  return result;
};

export const getUniqueVisitors = async (days: number = 30): Promise<number> => {
  const visits = await getVisitLogs(days);
  return new Set(visits.map(v => v.visitorId)).size;
};
