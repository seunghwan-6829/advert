'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { 
  UserPermission,
  VisitLog, 
  getAllUserPermissions,
  updateUserPermission,
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
  const [selectedUser, setSelectedUser] = useState<UserPermission | null>(null);
  const [editCanCreate, setEditCanCreate] = useState(false);
  const [editCanView, setEditCanView] = useState(false);
  const [editAllowedBrands, setEditAllowedBrands] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

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
    const [permData, brandsData, visitsData, statsData, uniqueData] = await Promise.all([
      getAllUserPermissions(),
      getBrands(),
      getVisitLogs(30),
      getDailyVisitStats(7),
      getUniqueVisitors(30),
    ]);
    setPermissions(permData);
    setBrands(brandsData);
    setVisits(visitsData);
    setDailyStats(statsData);
    setUniqueVisitors(uniqueData);
  };

  const exportToExcel = (type: 'users' | 'visits') => {
    let data: Record<string, unknown>[] = [];
    let filename = '';

    if (type === 'users') {
      data = permissions.map(p => ({
        '이메일': p.email,
        '기획안 생성': p.canCreatePlans ? 'O' : 'X',
        '프로젝트 열람': p.canViewProjects ? 'O' : 'X',
        '허용 프로젝트': p.allowedBrandIds.length === 0 ? '전체' : p.allowedBrandIds.length + '개',
      }));
      filename = `유저권한_${new Date().toISOString().split('T')[0]}.xlsx`;
    } else {
      data = visits.map(v => ({
        '이메일': v.userEmail || '비회원',
        '페이지': v.page,
        '일시': new Date(v.visitedAt).toLocaleString('ko-KR'),
      }));
      filename = `방문기록_${new Date().toISOString().split('T')[0]}.xlsx`;
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, filename);
  };

  const openEditModal = (perm: UserPermission) => {
    setSelectedUser(perm);
    setEditCanCreate(perm.canCreatePlans);
    setEditCanView(perm.canViewProjects);
    setEditAllowedBrands(perm.allowedBrandIds);
    setShowPermissionModal(true);
  };

  const handleSavePermission = async () => {
    if (!selectedUser) return;
    setSaving(true);
    await updateUserPermission(selectedUser.userId, {
      canCreatePlans: editCanCreate,
      canViewProjects: editCanView,
      allowedBrandIds: editAllowedBrands,
    });
    await loadData();
    setSaving(false);
    setShowPermissionModal(false);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setSaving(true);
    await deleteUserPermission(selectedUser.userId);
    await loadData();
    setSaving(false);
    setShowDeleteModal(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
        <div className="animate-pulse text-[#86868b]">로딩 중...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

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
              className="text-[#f97316] text-sm font-medium hover:underline"
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
              activeTab === 'users' ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-[#86868b]'
            }`}
          >
            유저 권한
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'analytics' ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-[#86868b]'
            }`}
          >
            방문 통계
          </button>
        </div>

        {/* 유저 권한 탭 */}
        {activeTab === 'users' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-[#86868b]">총 {permissions.length}명</p>
              <button
                onClick={() => exportToExcel('users')}
                className="px-4 py-2 bg-[#1d1d1f] text-white text-sm font-medium rounded-lg hover:bg-[#424245]"
              >
                Export
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#d2d2d7]">
                    <th className="text-left px-6 py-4 text-xs font-medium text-[#86868b] uppercase">이메일</th>
                    <th className="text-center px-6 py-4 text-xs font-medium text-[#86868b] uppercase">기획안 생성</th>
                    <th className="text-center px-6 py-4 text-xs font-medium text-[#86868b] uppercase">프로젝트 열람</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-[#86868b] uppercase">허용 프로젝트</th>
                    <th className="text-right px-6 py-4 text-xs font-medium text-[#86868b] uppercase">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d2d2d7]">
                  {permissions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[#86868b]">
                        등록된 유저가 없습니다
                      </td>
                    </tr>
                  ) : (
                    permissions.map((p) => (
                      <tr key={p.id} className="hover:bg-[#f5f5f7]">
                        <td className="px-6 py-4 text-[#1d1d1f] font-medium">{p.email}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            p.canCreatePlans ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {p.canCreatePlans ? 'ON' : 'OFF'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            p.canViewProjects ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {p.canViewProjects ? 'ON' : 'OFF'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#86868b]">
                          {p.allowedBrandIds.length === 0 ? '전체' : `${p.allowedBrandIds.length}개`}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => openEditModal(p)} className="text-[#f97316] text-sm hover:underline mr-3">
                            수정
                          </button>
                          <button onClick={() => { setSelectedUser(p); setShowDeleteModal(true); }} className="text-red-500 text-sm hover:underline">
                            삭제
                          </button>
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

            <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
              <p className="text-[#1d1d1f] font-medium mb-6">최근 7일 방문</p>
              <div className="flex items-end gap-2 h-40">
                {dailyStats.map((stat, i) => {
                  const max = Math.max(...dailyStats.map(s => s.count), 1);
                  const h = (stat.count / max) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col items-center justify-end h-32">
                        <span className="text-xs text-[#86868b] mb-1">{stat.count}</span>
                        <div className="w-full bg-[#f97316] rounded-t-md" style={{ height: `${Math.max(h, 4)}%` }} />
                      </div>
                      <span className="text-xs text-[#86868b]">
                        {new Date(stat.date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#d2d2d7]">
                <p className="text-[#1d1d1f] font-medium">최근 방문 기록</p>
                <button onClick={() => exportToExcel('visits')} className="px-4 py-2 bg-[#1d1d1f] text-white text-sm font-medium rounded-lg hover:bg-[#424245]">
                  Export
                </button>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#d2d2d7]">
                    <th className="text-left px-6 py-3 text-xs font-medium text-[#86868b] uppercase">유저</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-[#86868b] uppercase">페이지</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-[#86868b] uppercase">시간</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d2d2d7]">
                  {visits.length === 0 ? (
                    <tr><td colSpan={3} className="px-6 py-12 text-center text-[#86868b]">기록 없음</td></tr>
                  ) : (
                    visits.slice(0, 20).map((v) => (
                      <tr key={v.id} className="hover:bg-[#f5f5f7]">
                        <td className="px-6 py-3 text-[#1d1d1f]">{v.userEmail || '비회원'}</td>
                        <td className="px-6 py-3 text-[#86868b]">{v.page}</td>
                        <td className="px-6 py-3 text-[#86868b]">{new Date(v.visitedAt).toLocaleString('ko-KR')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* 권한 수정 모달 */}
      {showPermissionModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowPermissionModal(false)} />
          <div className="relative bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-xl font-semibold text-[#1d1d1f] mb-2">권한 설정</h2>
            <p className="text-[#86868b] mb-6">{selectedUser.email}</p>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-4 bg-[#f5f5f7] rounded-xl">
                <span className="text-[#1d1d1f] font-medium">기획안 생성</span>
                <button
                  onClick={() => setEditCanCreate(!editCanCreate)}
                  className={`w-12 h-7 rounded-full relative transition-colors ${editCanCreate ? 'bg-[#34c759]' : 'bg-[#d1d1d6]'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${editCanCreate ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-[#f5f5f7] rounded-xl">
                <span className="text-[#1d1d1f] font-medium">프로젝트 열람</span>
                <button
                  onClick={() => setEditCanView(!editCanView)}
                  className={`w-12 h-7 rounded-full relative transition-colors ${editCanView ? 'bg-[#34c759]' : 'bg-[#d1d1d6]'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${editCanView ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
            
            {editCanView && (
              <div className="mb-6">
                <p className="text-sm text-[#86868b] mb-3">열람 가능한 프로젝트</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#f5f5f7] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editAllowedBrands.length === 0}
                      onChange={() => setEditAllowedBrands([])}
                      className="w-5 h-5 accent-[#f97316]"
                    />
                    <span className="text-[#1d1d1f]">전체 프로젝트</span>
                  </label>
                  {brands.map(b => (
                    <label key={b.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#f5f5f7] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editAllowedBrands.includes(b.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditAllowedBrands([...editAllowedBrands, b.id]);
                          } else {
                            setEditAllowedBrands(editAllowedBrands.filter(id => id !== b.id));
                          }
                        }}
                        className="w-5 h-5 accent-[#f97316]"
                      />
                      <span className="text-[#1d1d1f]">{b.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <button onClick={() => setShowPermissionModal(false)} className="flex-1 px-4 py-3 bg-[#f5f5f7] text-[#1d1d1f] rounded-xl font-medium">
                취소
              </button>
              <button onClick={handleSavePermission} disabled={saving} className="flex-1 px-4 py-3 bg-[#f97316] text-white rounded-xl font-medium disabled:opacity-50">
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 모달 */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center">
            <h2 className="text-xl font-semibold text-[#1d1d1f] mb-2">권한 삭제</h2>
            <p className="text-[#86868b] mb-6">{selectedUser.email}<br />권한을 삭제하시겠습니까?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-3 bg-[#f5f5f7] text-[#1d1d1f] rounded-xl font-medium">
                취소
              </button>
              <button onClick={handleDeleteUser} disabled={saving} className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-medium disabled:opacity-50">
                {saving ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
