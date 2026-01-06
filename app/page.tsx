'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plan } from '@/types/plan';
import { getPlans } from '@/lib/store';
import Sidebar from '@/components/Sidebar';
import PlanCard from '@/components/PlanCard';
import { FileText, CheckCircle, Search, Plus, LayoutGrid, List } from 'lucide-react';
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
  const [plans, setPlans] = useState<Plan[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

  // URL에서 brand 파라미터 읽기
  useEffect(() => {
    const brandFromUrl = searchParams.get('brand');
    if (brandFromUrl) {
      setSelectedBrandId(brandFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    const loadPlans = async () => {
      const data = await getPlans();
      setPlans(data);
      setLoading(false);
    };
    loadPlans();
  }, []);

  // 브랜드 + 검색 필터링 (프로젝트 선택해야만 기획안 표시)
  const filteredPlans = selectedBrandId 
    ? plans.filter(plan => {
        // 선택된 프로젝트의 기획안만 표시
        if (plan.brandId !== selectedBrandId) {
          return false;
        }
        // 검색 필터 (제목으로만 검색)
        if (searchQuery) {
          return plan.title.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return true;
      })
    : []; // 프로젝트 미선택 시 빈 배열

  // 통계 계산 (선택된 프로젝트 기준)
  const stats = {
    total: filteredPlans.length,
    completed: 0, // 추후 구현
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
        {/* 상단 통계 + 검색바 (고정) */}
        <div className="sticky top-0 z-10 bg-[#f8f6f2] px-8 py-5">
          <div className="flex items-center gap-4">
          {/* 통계 카드들 */}
          <div className="stat-card">
            <div className="stat-icon bg-[#fff7ed]">
              <FileText size={18} className="text-[#f97316]" />
            </div>
            <div>
              <div className="text-xl font-bold text-[#1a1a1a]">{stats.total}</div>
              <div className="text-xs text-[#6b7280]">전체 개수</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon bg-[#dcfce7]">
              <CheckCircle size={18} className="text-[#22c55e]" />
            </div>
            <div>
              <div className="text-xl font-bold text-[#1a1a1a]">{stats.completed}</div>
              <div className="text-xs text-[#6b7280]">완료</div>
            </div>
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
        <div className="px-8 pb-8">
        {/* 툴바 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
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

            {/* 새 기획안 버튼 (프로젝트 선택 시에만 활성화) */}
            {selectedBrandId && (
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
          // 스켈레톤 로딩
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
                <PlanCard plan={plan} />
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
      </main>
    </div>
  );
}

// 메인 페이지 스켈레톤
function PageSkeleton() {
  return (
    <div className="flex min-h-screen">
      {/* 사이드바 스켈레톤 */}
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
      
      {/* 메인 콘텐츠 스켈레톤 */}
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
