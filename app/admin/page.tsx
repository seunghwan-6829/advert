'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { 
  VisitLog, 
  getVisitLogs, 
  getDailyVisitStats, 
  getUniqueVisitors 
} from '@/lib/adminStore';
import { getBrands } from '@/lib/store';
import { Brand } from '@/types/plan';
import * as XLSX from 'xlsx';

export default function AdminPage() {
  const router = useRouter();
  const { user, isAdmin, isLoading } = useAuth();
  
  const [brands, setBrands] = useState<Brand[]>([]);
  const [visits, setVisits] = useState<VisitLog[]>([]);
  const [dailyStats, setDailyStats] = useState<{ date: string; count: number }[]>([]);
  const [uniqueVisitors, setUniqueVisitors] = useState(0);

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
    const [brandsData, visitsData, statsData, uniqueData] = await Promise.all([
      getBrands(),
      getVisitLogs(30),
      getDailyVisitStats(7),
      getUniqueVisitors(30),
    ]);
    setBrands(brandsData);
    setVisits(visitsData);
    setDailyStats(statsData);
    setUniqueVisitors(uniqueData);
  };

  // Excel Export
  const exportToExcel = () => {
    const data = visits.map(v => ({
      '이메일': v.userEmail || '비회원',
      '방문 페이지': v.page,
      '방문 일시': new Date(v.visitedAt).toLocaleString('ko-KR'),
    }));
    const filename = `방문기록_${new Date().toISOString().split('T')[0]}.xlsx`;

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, filename);
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
        {/* 프로젝트 현황 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-[#1d1d1f] mb-4">프로젝트 현황</h2>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-4xl font-semibold text-[#1d1d1f]">{brands.length}</p>
            <p className="text-[#86868b] text-sm mt-1">등록된 프로젝트</p>
          </div>
        </div>

        {/* 방문 통계 */}
        <div>
          <h2 className="text-lg font-semibold text-[#1d1d1f] mb-4">방문 통계</h2>
          
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
                onClick={exportToExcel}
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
                      <td className="px-6 py-3 text-[#1d1d1f]">{v.userEmail || '비회원'}</td>
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
      </main>
    </div>
  );
}
