import { v4 as uuidv4 } from 'uuid';

// 유저 권한 타입 (로컬 스토리지 전용)
export interface UserPermission {
  id: string;
  visitorId: string;
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

const PERMISSIONS_STORAGE_KEY = 'advert_user_permissions';
const VISITS_STORAGE_KEY = 'advert_visits';

// ==================== 유저 권한 관리 (로컬 스토리지) ====================

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
  return getLocalPermissions();
};

// 특정 유저 권한 가져오기
export const getUserPermission = async (visitorId: string): Promise<UserPermission | null> => {
  const permissions = getLocalPermissions();
  return permissions.find(p => p.visitorId === visitorId) || null;
};

// 유저 권한 생성/업데이트
export const upsertUserPermission = async (
  visitorId: string,
  email: string,
  updates: {
    canCreatePlans?: boolean;
    canViewProjects?: boolean;
    allowedBrandIds?: string[];
  }
): Promise<void> => {
  const now = new Date().toISOString();
  const permissions = getLocalPermissions();
  const index = permissions.findIndex(p => p.visitorId === visitorId);
  
  if (index !== -1) {
    permissions[index] = {
      ...permissions[index],
      ...updates,
      updatedAt: now,
    };
  } else {
    permissions.push({
      id: uuidv4(),
      visitorId,
      email,
      canCreatePlans: updates.canCreatePlans ?? true,
      canViewProjects: updates.canViewProjects ?? true,
      allowedBrandIds: updates.allowedBrandIds ?? [],
      createdAt: now,
      updatedAt: now,
    });
  }
  setLocalPermissions(permissions);
};

// 유저 권한 삭제
export const deleteUserPermission = async (visitorId: string): Promise<void> => {
  const permissions = getLocalPermissions();
  const filtered = permissions.filter(p => p.visitorId !== visitorId);
  setLocalPermissions(filtered);
};

// ==================== 방문 통계 (로컬 스토리지) ====================

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
export const logVisit = async (visitorId: string, userEmail: string, page: string): Promise<void> => {
  const visit: VisitLog = {
    id: uuidv4(),
    visitorId,
    userEmail,
    visitedAt: new Date().toISOString(),
    page,
  };

  const visits = getLocalVisits();
  setLocalVisits([visit, ...visits.slice(0, 999)]); // 최대 1000개만 유지
};

// 방문 기록 가져오기
export const getVisitLogs = async (days: number = 30): Promise<VisitLog[]> => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
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
  const uniqueUsers = new Set(visits.map(v => v.visitorId));
  return uniqueUsers.size;
};
