'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { 
  UserPermission, 
  VisitLog, 
  getAllUserPermissions, 
  upsertUserPermission, 
  deleteUserPermission,
  getVisitLogs, 
  getDailyVisitStats, 
  getUniqueVisitors 
} from '@/lib/adminStore';
import { getBrands } from '@/lib/store';
import { Brand } from '@/types/plan';
import * as XLSX from 'xlsx';

type Tab = 'users' | 'analytics';

export default function AdminPage() {
  const router = useRouter();
  const { user, isAdmin, isLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [visits, setVisits] = useState<VisitLog[]>([]);
  const [dailyStats, setDailyStats] = useState<{ date: string; count: number }[]>([]);
  const [uniqueVisitors, setUniqueVisitors] = useState(0);
  
  // 모달 상태
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<UserPermission | null>(null);
  
  // 권한 편집 상태
  const [editCanCreatePlans, setEditCanCreatePlans] = useState(false);
  const [editCanViewProjects, setEditCanViewProjects] = useState(false);
  const [editAllowedBrands, setEditAllowedBrands] = useState<string[]>([]);

  // 관리자가 아니면 리다이렉트
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, isLoading, router]);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    const [permissionsData, brandsData, visitsData, statsData, uniqueData] = await Promise.all([
      getAllUserPermissions(),
      getBrands(),
      getVisitLogs(30),
      getDailyVisitStats(7),
      getUniqueVisitors(30),
    ]);
    setPermissions(permissionsData);
    setBrands(brandsData);
    setVisits(visitsData);
    setDailyStats(statsData);
    setUniqueVisitors(uniqueData);
  };

  // Excel Export
  const exportToExcel = (type: 'users' | 'visits') => {
    let data: Record<string, unknown>[] = [];
    let filename = '';

    if (type === 'users') {
      data = permissions.map(p => ({
        '이메일': p.email,
        '기획안 생성 권한': p.canCreatePlans ? 'O' : 'X',
        '프로젝트 열람 권한': p.canViewProjects ? 'O' : 'X',
        '허용된 프로젝트': p.allowedBrandIds.length > 0 
          ? p.allowedBrandIds.map(id => brands.find(b => b.id === id)?.name || id).join(', ')
          : '전체',
      }));
      filename = `유저권한_${new Date().toISOString().split('T')[0]}.xlsx`;
    } else {
      data = visits.map(v => ({
        '이메일': v.userEmail,
        '방문 페이지': v.page,
        '방문 일시': new Date(v.visitedAt).toLocaleString('ko-KR'),
      }));
      filename = `방문기록_${new Date().toISOString().split('T')[0]}.xlsx`;
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, filename);
  };

  // 권한 편집 모달 열기
  const openPermissionModal = (permission: UserPermission) => {
    setSelectedPermission(permission);
    setEditCanCreatePlans(permission.canCreatePlans);
    setEditCanViewProjects(permission.canViewProjects);
    setEditAllowedBrands(permission.allowedBrandIds);
    setShowPermissionModal(true);
  };

  // 권한 저장
  const handlePermissionSave = async () => {
    if (selectedPermission) {
      await upsertUserPermission(
        selectedPermission.userId,
        selectedPermission.email,
        {
          canCreatePlans: editCanCreatePlans,
          canViewProjects: editCanViewProjects,
          allowedBrandIds: editAllowedBrands,
        }
      );
      await loadData();
      setShowPermissionModal(false);
      setSelectedPermission(null);
    }
  };

  // 권한 삭제
  const handleDeletePermission = async () => {
    if (selectedPermission) {
      await deleteUserPermission(selectedPermission.userId);
      await loadData();
      setShowDeleteModal(false);
      setSelectedPermission(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
        <p className="text-[#86868b]">로딩 중...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const totalVisits = visits.length;
  const todayVisits = visits.filter(v => 
    v.visitedAt.split('T')[0] === new Date().toISOString().split('T')[0]
  ).length;

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-[#d2d2d7] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-[#1d1d1f]">관리자</h1>
              <p className="text-sm text-[#86868b] mt-0.5">{user?.email}</p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="text-[#0071e3] text-sm font-medium hover:underline"
            >
              돌아가기
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* 탭 */}
        <div className="flex gap-1 p-1 bg-[#e8e8ed] rounded-lg w-fit mb-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'users'
                ? 'bg-white text-[#1d1d1f] shadow-sm'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            유저 권한 관리
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'analytics'
                ? 'bg-white text-[#1d1d1f] shadow-sm'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            방문 통계
          </button>
        </div>

        {/* 유저 권한 관리 탭 */}
        {activeTab === 'users' && (
          <div>
            {/* 상단 액션 */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-[#86868b]">총 {permissions.length}명의 유저</p>
              <button
                onClick={() => exportToExcel('users')}
                className="px-4 py-2 bg-[#1d1d1f] text-white text-sm font-medium rounded-lg hover:bg-[#424245] transition-colors"
              >
                Export
              </button>
            </div>

            {/* 유저 목록 */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#d2d2d7]">
                    <th className="text-left px-6 py-4 text-xs font-medium text-[#86868b] uppercase tracking-wider">이메일</th>
                    <th className="text-center px-6 py-4 text-xs font-medium text-[#86868b] uppercase tracking-wider">기획안 생성</th>
                    <th className="text-center px-6 py-4 text-xs font-medium text-[#86868b] uppercase tracking-wider">프로젝트 열람</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-[#86868b] uppercase tracking-wider">허용된 프로젝트</th>
                    <th className="text-right px-6 py-4 text-xs font-medium text-[#86868b] uppercase tracking-wider">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d2d2d7]">
                  {permissions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[#86868b]">
                        등록된 유저 권한이 없습니다
                      </td>
                    </tr>
                  ) : (
                    permissions.map((p) => (
                      <tr key={p.id} className="hover:bg-[#f5f5f7] transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-[#1d1d1f] font-medium">{p.email}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            p.canCreatePlans 
                              ? 'bg-[#e8f5e9] text-[#2e7d32]' 
                              : 'bg-[#f5f5f7] text-[#86868b]'
                          }`}>
                            {p.canCreatePlans ? 'ON' : 'OFF'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            p.canViewProjects 
                              ? 'bg-[#e8f5e9] text-[#2e7d32]' 
                              : 'bg-[#f5f5f7] text-[#86868b]'
                          }`}>
                            {p.canViewProjects ? 'ON' : 'OFF'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#86868b]">
                          {p.allowedBrandIds.length === 0 ? (
                            <span className="text-[#0071e3]">전체</span>
                          ) : (
                            <span>{p.allowedBrandIds.length}개 프로젝트</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => openPermissionModal(p)}
                              className="text-[#0071e3] text-sm hover:underline"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => {
                                setSelectedPermission(p);
                                setShowDeleteModal(true);
                              }}
                              className="text-[#ff3b30] text-sm hover:underline"
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 방문 통계 탭 */}
        {activeTab === 'analytics' && (
          <div>
            {/* 통계 카드 */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <p className="text-[#86868b] text-sm mb-1">오늘 방문</p>
                <p className="text-4xl font-semibold text-[#1d1d1f]">{todayVisits}</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <p className="text-[#86868b] text-sm mb-1">총 방문 (30일)</p>
                <p className="text-4xl font-semibold text-[#1d1d1f]">{totalVisits}</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <p className="text-[#86868b] text-sm mb-1">고유 방문자</p>
                <p className="text-4xl font-semibold text-[#1d1d1f]">{uniqueVisitors}</p>
              </div>
            </div>

            {/* 일별 차트 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
              <div className="flex items-center justify-between mb-6">
                <p className="text-[#1d1d1f] font-medium">최근 7일 방문</p>
              </div>
              <div className="flex items-end gap-2 h-40">
                {dailyStats.map((stat, i) => {
                  const maxCount = Math.max(...dailyStats.map(s => s.count), 1);
                  const height = (stat.count / maxCount) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col items-center justify-end h-32">
                        <span className="text-xs text-[#86868b] mb-1">{stat.count}</span>
                        <div
                          className="w-full bg-[#f97316] rounded-t-md transition-all"
                          style={{ height: `${Math.max(height, 4)}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#86868b]">
                        {new Date(stat.date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 방문 기록 */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#d2d2d7]">
                <p className="text-[#1d1d1f] font-medium">최근 방문 기록</p>
                <button
                  onClick={() => exportToExcel('visits')}
                  className="px-4 py-2 bg-[#1d1d1f] text-white text-sm font-medium rounded-lg hover:bg-[#424245] transition-colors"
                >
                  Export
                </button>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#d2d2d7]">
                    <th className="text-left px-6 py-3 text-xs font-medium text-[#86868b] uppercase tracking-wider">유저</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-[#86868b] uppercase tracking-wider">페이지</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-[#86868b] uppercase tracking-wider">시간</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d2d2d7]">
                  {visits.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-[#86868b]">
                        방문 기록이 없습니다
                      </td>
                    </tr>
                  ) : (
                    visits.slice(0, 20).map((v) => (
                      <tr key={v.id} className="hover:bg-[#f5f5f7] transition-colors">
                        <td className="px-6 py-3 text-[#1d1d1f]">{v.userEmail}</td>
                        <td className="px-6 py-3 text-[#86868b]">{v.page}</td>
                        <td className="px-6 py-3 text-[#86868b]">
                          {new Date(v.visitedAt).toLocaleString('ko-KR')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* 권한 설정 모달 */}
      {showPermissionModal && selectedPermission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPermissionModal(false)} />
          <div className="relative bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-xl font-semibold text-[#1d1d1f] mb-2">권한 설정</h2>
            <p className="text-[#86868b] mb-6">{selectedPermission.email}</p>
            
            {/* 기능 토글 */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-4 bg-[#f5f5f7] rounded-xl">
                <span className="text-[#1d1d1f] font-medium">기획안 생성 권한</span>
                <button
                  onClick={() => setEditCanCreatePlans(!editCanCreatePlans)}
                  className={`w-14 h-8 rounded-full transition-colors relative ${
                    editCanCreatePlans ? 'bg-[#34c759]' : 'bg-[#d1d1d6]'
                  }`}
                >
                  <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    editCanCreatePlans ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-[#f5f5f7] rounded-xl">
                <span className="text-[#1d1d1f] font-medium">프로젝트 열람 권한</span>
                <button
                  onClick={() => setEditCanViewProjects(!editCanViewProjects)}
                  className={`w-14 h-8 rounded-full transition-colors relative ${
                    editCanViewProjects ? 'bg-[#34c759]' : 'bg-[#d1d1d6]'
                  }`}
                >
                  <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    editCanViewProjects ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
            
            {/* 프로젝트 선택 */}
            {editCanViewProjects && (
              <div className="mb-6">
                <p className="text-sm text-[#86868b] mb-3">열람 가능한 프로젝트 선택</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#f5f5f7] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editAllowedBrands.length === 0}
                      onChange={() => setEditAllowedBrands([])}
                      className="w-5 h-5 rounded accent-[#f97316]"
                    />
                    <span className="text-[#1d1d1f]">전체 프로젝트</span>
                  </label>
                  
                  {brands.map(brand => (
                    <label key={brand.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#f5f5f7] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editAllowedBrands.includes(brand.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditAllowedBrands([...editAllowedBrands, brand.id]);
                          } else {
                            setEditAllowedBrands(editAllowedBrands.filter(id => id !== brand.id));
                          }
                        }}
                        className="w-5 h-5 rounded accent-[#f97316]"
                      />
                      <span className="text-[#1d1d1f]">{brand.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowPermissionModal(false)}
                className="flex-1 px-4 py-3 bg-[#f5f5f7] text-[#1d1d1f] rounded-xl font-medium hover:bg-[#e8e8ed] transition-colors"
              >
                취소
              </button>
              <button
                onClick={handlePermissionSave}
                className="flex-1 px-4 py-3 bg-[#f97316] text-white rounded-xl font-medium hover:bg-[#ea580c] transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteModal && selectedPermission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center">
            <h2 className="text-xl font-semibold text-[#1d1d1f] mb-2">권한 삭제</h2>
            <p className="text-[#86868b] mb-6">
              <span className="text-[#1d1d1f] font-medium">{selectedPermission.email}</span>
              <br />의 권한을 삭제하시겠습니까?
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-3 bg-[#f5f5f7] text-[#1d1d1f] rounded-xl font-medium hover:bg-[#e8e8ed] transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDeletePermission}
                className="flex-1 px-4 py-3 bg-[#ff3b30] text-white rounded-xl font-medium hover:bg-[#ff453a] transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
