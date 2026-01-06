import { supabase, isSupabaseConfigured } from './supabase';
import { v4 as uuidv4 } from 'uuid';

// 유저 타입
export interface AppUser {
  id: string;
  email: string;
  createdAt: string;
  lastSignIn: string | null;
  accessibleBrands: string[]; // 접근 가능한 브랜드 ID 목록
  isActive: boolean;
}

// 방문 기록 타입
export interface VisitLog {
  id: string;
  userId: string;
  userEmail: string;
  visitedAt: string;
  page: string;
}

const USERS_STORAGE_KEY = 'advert_users';
const VISITS_STORAGE_KEY = 'advert_visits';

// ==================== 유저 관리 ====================

// 로컬 스토리지에서 유저 불러오기
const getLocalUsers = (): AppUser[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(USERS_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

// 로컬 스토리지에 유저 저장
const setLocalUsers = (users: AppUser[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

// 모든 유저 가져오기
export const getUsers = async (): Promise<AppUser[]> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      // Supabase Admin API는 서버에서만 사용 가능
      // 클라이언트에서는 별도 테이블 사용
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data?.map(u => ({
        id: u.id,
        email: u.email,
        createdAt: u.created_at,
        lastSignIn: u.last_sign_in,
        accessibleBrands: u.accessible_brands || [],
        isActive: u.is_active ?? true,
      })) || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return getLocalUsers();
    }
  }
  return getLocalUsers();
};

// 유저 접근 권한 업데이트
export const updateUserAccess = async (userId: string, brandIds: string[]): Promise<void> => {
  if (isSupabaseConfigured() && supabase) {
    await supabase
      .from('app_users')
      .update({ accessible_brands: brandIds })
      .eq('id', userId);
  } else {
    const users = getLocalUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index].accessibleBrands = brandIds;
      setLocalUsers(users);
    }
  }
};

// 유저 비활성화/활성화
export const toggleUserActive = async (userId: string, isActive: boolean): Promise<void> => {
  if (isSupabaseConfigured() && supabase) {
    await supabase
      .from('app_users')
      .update({ is_active: isActive })
      .eq('id', userId);
  } else {
    const users = getLocalUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index].isActive = isActive;
      setLocalUsers(users);
    }
  }
};

// 유저 삭제 (실제로는 비활성화)
export const deleteUser = async (userId: string): Promise<void> => {
  if (isSupabaseConfigured() && supabase) {
    await supabase
      .from('app_users')
      .delete()
      .eq('id', userId);
  } else {
    const users = getLocalUsers();
    const filtered = users.filter(u => u.id !== userId);
    setLocalUsers(filtered);
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

