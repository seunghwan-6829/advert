'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plan } from '@/types/plan';
import { getPlans } from '@/lib/store';
import { useAuth } from '@/lib/AuthContext';
import Sidebar from '@/components/Sidebar';
import PlanCard from '@/components/PlanCard';
import { FileText, CheckCircle, Search, Plus, LayoutGrid, List, Lock } from 'lucide-react';
import Link from 'next/link';

// 스켈레톤 카드 컴포넌트
function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl p-4 border border-[#f0e6dc] animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
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
    completed: filteredPlans.filter(p => p.isCompleted).length,
  };

  // 기획안 목록 새로고침
  const refreshPlans = async () => {
    const data = await getPlans();
    setPlans(data);
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
        onSelectBrand={handleSelectBrand}
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
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-[#22c55e]" />
                  <span className="text-lg font-bold text-[#1a1a1a]">{stats.completed}</span>
                  <span className="text-sm text-[#6b7280]">완료</span>
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
                      <PlanCard plan={plan} onUpdate={refreshPlans} />
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
    </div>
  );
}

// 메인 페이지 스켈레톤
function PageSkeleton() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-60 h-screen bg-white flex flex-col border-r border-[#f0e6dc] fixed left-0 top-0">
        <div className="p-4 pb-2">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="px-4 pb-4 border-b border-[#f0e6dc]">
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="p-3 space-y-2">
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </aside>
      <main className="flex-1 ml-60 p-8">
        <div className="flex gap-4 mb-6">
          <div className="h-16 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="h-16 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
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
