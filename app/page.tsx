'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plan } from '@/types/plan';
import { getPlans } from '@/lib/store';
import { useAuth } from '@/lib/AuthContext';
import Sidebar from '@/components/Sidebar';
import PlanCard from '@/components/PlanCard';
import { FileText, Search, Plus, LayoutGrid, List, Lock, Save, AlertTriangle } from 'lucide-react';
import { updatePlan } from '@/lib/store';
import Link from 'next/link';

// 스켈레톤 카드 컴포넌트 - 실제 카드와 동일한 구조
function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl p-5 border border-[#f0e6dc] overflow-hidden relative">
      {/* Shimmer 효과 */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      
      {/* 상단: 태그 & 날짜 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-20 bg-[#fff7ed] rounded-full" />
          <div className="h-6 w-16 bg-gray-100 rounded-full" />
        </div>
        <div className="h-4 w-16 bg-gray-100 rounded" />
      </div>
      
      {/* 제목 */}
      <div className="h-6 bg-gray-200 rounded w-4/5 mb-3" />
      
      {/* 미리보기 텍스트 */}
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-2/3" />
      </div>
      
      {/* 하단 */}
      <div className="pt-3 border-t border-[#f0e6dc] flex justify-end">
        <div className="h-4 w-20 bg-[#fff7ed] rounded" />
      </div>
    </div>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAdmin, permissions, isLoading: authLoading } = useAuth();
  
  const [plans, setPlans] = useState<Plan[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  
  // 저장되지 않은 완료 상태 변경 추적
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});
  const [showUnsavedToast, setShowUnsavedToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 권한 체크
  const canViewProjects = isAdmin || permissions?.canViewProjects;
  const canCreatePlans = isAdmin || permissions?.canCreatePlans;

  // URL에서 brand 파라미터 읽기
  useEffect(() => {
    const brandFromUrl = searchParams.get('brand');
    if (brandFromUrl) {
      setSelectedBrandId(brandFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    // 권한이 있을 때만 기획안 로드
    if (canViewProjects) {
      const loadPlans = async () => {
        const data = await getPlans();
        setPlans(data);
        setLoading(false);
      };
      loadPlans();
    } else {
      setLoading(false);
    }
  }, [canViewProjects]);

  // 브랜드 + 검색 필터링 (프로젝트 선택해야만 기획안 표시)
  const filteredPlans = selectedBrandId 
    ? plans.filter(plan => {
        if (plan.brandId !== selectedBrandId) return false;
        if (searchQuery) {
          return plan.title.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return true;
      })
    : [];

  // 통계 계산
  const stats = {
    total: filteredPlans.length,
  };

  // 저장되지 않은 변경사항 개수
  const unsavedCount = Object.keys(pendingChanges).length;

  // 완료 상태 변경 (저장 안 함, 로컬만)
  const handleCompletionChange = (planId: string, isCompleted: boolean) => {
    setPendingChanges(prev => ({ ...prev, [planId]: isCompleted }));
  };

  // 변경사항 저장
  const handleSaveChanges = async () => {
    setIsSaving(true);
    for (const [planId, isCompleted] of Object.entries(pendingChanges)) {
      await updatePlan(planId, { isCompleted });
    }
    // 저장 후 목록 새로고침
    const data = await getPlans();
    setPlans(data);
    setPendingChanges({});
    setIsSaving(false);
  };

  // 프로젝트 변경 시 저장되지 않은 변경 체크
  const handleSelectBrandWithCheck = (brandId: string | null) => {
    if (unsavedCount > 0) {
      setShowUnsavedToast(true);
      setTimeout(() => setShowUnsavedToast(false), 3000);
      return;
    }
    handleSelectBrand(brandId);
  };

  // 브랜드 선택 시 URL 업데이트
  const handleSelectBrand = (brandId: string | null) => {
    setSelectedBrandId(brandId);
    if (brandId) {
      router.push(`/?brand=${brandId}`, { scroll: false });
    } else {
      router.push('/', { scroll: false });
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* 사이드바 */}
      <Sidebar 
        plans={plans} 
        selectedBrandId={selectedBrandId}
        onSelectBrand={handleSelectBrandWithCheck}
      />

      {/* 메인 콘텐츠 */}
      <main className="flex-1 ml-60">
        {/* 로그인 안 한 경우 */}
        {!authLoading && !user && (
          <div className="flex flex-col items-center justify-center min-h-screen px-8">
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-[#f0e6dc] max-w-md">
              <div className="w-16 h-16 bg-[#fff7ed] rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock size={32} className="text-[#f97316]" />
              </div>
              <h2 className="text-2xl font-bold text-[#1a1a1a] mb-3">로그인이 필요합니다</h2>
              <p className="text-[#6b7280] mb-6">
                기획안을 열람하려면 로그인해주세요.
              </p>
              <p className="text-sm text-[#9ca3af]">
                왼쪽 사이드바에서 로그인할 수 있습니다.
              </p>
            </div>
          </div>
        )}

        {/* 로그인 했지만 권한 없는 경우 */}
        {!authLoading && user && !canViewProjects && (
          <div className="flex flex-col items-center justify-center min-h-screen px-8">
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-[#f0e6dc] max-w-md">
              <div className="w-16 h-16 bg-[#fef2f2] rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock size={32} className="text-[#ef4444]" />
              </div>
              <h2 className="text-2xl font-bold text-[#1a1a1a] mb-3">접근 권한이 없습니다</h2>
              <p className="text-[#6b7280] mb-6">
                기획안 열람 권한이 없습니다.<br />
                관리자에게 권한을 요청해주세요.
              </p>
              <p className="text-sm text-[#9ca3af]">
                {user.email}
              </p>
            </div>
          </div>
        )}

        {/* 권한 있는 경우 - 기존 콘텐츠 표시 */}
        {!authLoading && canViewProjects && (
          <>
            {/* 상단 통계 + 검색바 (고정) */}
            <div className="sticky top-0 z-10 bg-white border-b border-[#f0e6dc] px-8 py-4">
              <div className="flex items-center gap-6">
                {/* 통계 - 일자 나열 */}
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-[#f97316]" />
                  <span className="text-lg font-bold text-[#1a1a1a]">{stats.total}</span>
                  <span className="text-sm text-[#6b7280]">전체 개수</span>
                </div>

                {/* 검색바 */}
                <div className="search-bar ml-auto">
                  <input
                    type="text"
                    placeholder="검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="min-w-[200px]"
                  />
                  <button className="icon-btn">
                    <Search size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* 컨텐츠 영역 */}
            <div className="px-8 pt-6 pb-8">
              {/* 툴바 - 기획안 목록 + 버튼들 한 줄에 */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-[#1a1a1a]">기획안 목록</h2>
                  <span className="text-sm text-[#6b7280]">
                    총 {filteredPlans.length}개
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* 뷰 모드 토글 */}
                  <div className="flex items-center bg-white rounded-lg p-1 border border-[#f0e6dc]">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md ${
                        viewMode === 'grid'
                          ? 'bg-[#f97316] text-white'
                          : 'text-[#6b7280] hover:text-[#f97316]'
                      }`}
                    >
                      <LayoutGrid size={16} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md ${
                        viewMode === 'list'
                          ? 'bg-[#f97316] text-white'
                          : 'text-[#6b7280] hover:text-[#f97316]'
                      }`}
                    >
                      <List size={16} />
                    </button>
                  </div>

                  {/* 저장 버튼 (변경사항 있을 때만) */}
                  {unsavedCount > 0 && (
                    <button 
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2 bg-[#22c55e] text-white text-sm font-medium rounded-lg hover:bg-[#16a34a] transition-colors disabled:opacity-50"
                    >
                      <Save size={16} />
                      {isSaving ? '저장 중...' : `저장 (${unsavedCount}개)`}
                    </button>
                  )}

                  {/* 새 기획안 버튼 (권한 있고 프로젝트 선택 시에만) */}
                  {selectedBrandId && canCreatePlans && (
                    <Link href={`/plan/new?brand=${selectedBrandId}`}>
                      <button className="btn-primary flex items-center gap-2 text-sm">
                        <Plus size={16} />
                        새 기획안
                      </button>
                    </Link>
                  )}
                </div>
              </div>

              {/* 기획안 목록 */}
              {loading && selectedBrandId ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {[1, 2, 3, 4].map((i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : filteredPlans.length === 0 ? (
                null
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredPlans.map((plan, index) => (
                    <div key={plan.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.03}s` }}>
                      <PlanCard 
                        plan={plan} 
                        pendingCompleted={pendingChanges[plan.id] !== undefined ? pendingChanges[plan.id] : undefined}
                        onCompletionChange={handleCompletionChange}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPlans.map((plan, index) => (
                    <Link key={plan.id} href={`/plan/${plan.id}?brand=${plan.brandId}`}>
                      <div 
                        className="flex items-center justify-between p-4 bg-white rounded-xl hover:shadow-md transition-all cursor-pointer border border-[#f0e6dc] hover:border-[#fed7aa] animate-fade-in-up"
                        style={{ animationDelay: `${index * 0.03}s` }}
                      >
                        <div className="flex items-center gap-4">
                          <span className="tag tag-orange">
                            <FileText size={12} />
                            {plan.storyboard?.length || 0}개 장면
                          </span>
                          <span className="text-[#1a1a1a] font-medium">{plan.title}</span>
                        </div>
                        <span className="text-sm text-[#6b7280]">
                          {new Date(plan.createdAt).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* 저장되지 않음 토스트 알림 */}
      {showUnsavedToast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="flex items-center gap-3 px-5 py-3 bg-[#fef3c7] border border-[#fcd34d] rounded-xl shadow-lg">
            <AlertTriangle size={20} className="text-[#f59e0b]" />
            <span className="text-sm font-medium text-[#92400e]">
              저장되지 않은 변경사항이 있습니다. 먼저 저장해주세요!
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// 메인 페이지 스켈레톤 - 더 풍부하게
function PageSkeleton() {
  return (
    <div className="flex min-h-screen bg-[#f8f6f2]">
      {/* 사이드바 스켈레톤 */}
      <aside className="w-60 h-screen bg-white flex flex-col border-r border-[#f0e6dc] fixed left-0 top-0">
        <div className="p-4 pb-2">
          <div className="h-7 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
        <div className="px-4 pb-4 border-b border-[#f0e6dc]">
          <div className="h-9 bg-gray-100 rounded-lg w-full animate-pulse"></div>
        </div>
        <div className="p-3 border-b border-[#f0e6dc]">
          <div className="h-12 bg-[#fff7ed] rounded-lg animate-pulse"></div>
        </div>
        <div className="px-3 pt-4">
          <div className="h-8 bg-gray-100 rounded-lg w-32 mb-3 animate-pulse"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </aside>
      
      {/* 메인 콘텐츠 스켈레톤 */}
      <main className="flex-1 ml-60">
        <div className="sticky top-0 z-10 bg-white border-b border-[#f0e6dc] px-8 py-4">
          <div className="flex items-center gap-6">
            <div className="h-8 w-24 bg-gray-100 rounded-lg animate-pulse"></div>
            <div className="h-10 flex-1 max-w-md bg-gray-100 rounded-xl animate-pulse"></div>
          </div>
        </div>
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="h-7 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex gap-2">
              <div className="h-10 w-10 bg-gray-100 rounded-lg animate-pulse"></div>
              <div className="h-10 w-10 bg-gray-100 rounded-lg animate-pulse"></div>
              <div className="h-10 w-28 bg-[#fff7ed] rounded-lg animate-pulse"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
