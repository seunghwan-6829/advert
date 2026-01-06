'use client';

import { useEffect, useState } from 'react';
import { Plan } from '@/types/plan';
import { getPlans } from '@/lib/store';
import Sidebar from '@/components/Sidebar';
import PlanCard from '@/components/PlanCard';
import { FileText, Star, CheckCircle, TrendingUp, Search, Keyboard, Mic, Settings, Plus, LayoutGrid, List } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadPlans = async () => {
      const data = await getPlans();
      setPlans(data);
      setLoading(false);
    };
    loadPlans();
  }, []);

  // 검색 필터링
  const filteredPlans = plans.filter(plan => 
    plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // 통계 계산
  const stats = {
    total: plans.length,
    favorites: 0, // 추후 구현
    completed: 0, // 추후 구현
    progress: plans.length > 0 ? Math.round((0 / plans.length) * 100) : 0,
  };

  return (
    <div className="flex min-h-screen bg-[#f8f6f2]">
      {/* 사이드바 */}
      <Sidebar plans={plans} />

      {/* 메인 콘텐츠 */}
      <main className="flex-1 ml-60 p-8">
        {/* 상단 통계 + 검색바 */}
        <div className="flex items-center gap-4 mb-8">
          {/* 통계 카드들 */}
          <div className="stat-card">
            <div className="stat-icon bg-[#dbeafe]">
              <FileText size={18} className="text-[#3b82f6]" />
            </div>
            <div>
              <div className="text-xl font-bold text-[#1a1a1a]">{stats.total}</div>
              <div className="text-xs text-[#6b7280]">전체 개수</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon bg-[#fef3c7]">
              <Star size={18} className="text-[#f59e0b]" />
            </div>
            <div>
              <div className="text-xl font-bold text-[#1a1a1a]">{stats.favorites}</div>
              <div className="text-xs text-[#6b7280]">즐겨찾기</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon bg-[#dcfce7]">
              <CheckCircle size={18} className="text-[#22c55e]" />
            </div>
            <div>
              <div className="text-xl font-bold text-[#1a1a1a]">{stats.completed}</div>
              <div className="text-xs text-[#6b7280]">학습완료</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon bg-[#f3e8ff]">
              <TrendingUp size={18} className="text-[#8b5cf6]" />
            </div>
            <div>
              <div className="text-xl font-bold text-[#1a1a1a]">{stats.progress}%</div>
              <div className="text-xs text-[#6b7280]">학습 진도</div>
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
            <div className="flex items-center gap-2">
              <button className="icon-btn">
                <Keyboard size={18} />
              </button>
              <button className="icon-btn">
                <Mic size={18} />
              </button>
              <button className="icon-btn">
                <Settings size={18} />
              </button>
              <button className="icon-btn">
                <Search size={18} />
              </button>
            </div>
          </div>
        </div>

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
            <div className="flex items-center bg-white rounded-lg p-1 border border-[#e8e8e8]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md ${
                  viewMode === 'grid'
                    ? 'bg-[#3b82f6] text-white'
                    : 'text-[#6b7280] hover:text-[#1a1a1a]'
                }`}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md ${
                  viewMode === 'list'
                    ? 'bg-[#3b82f6] text-white'
                    : 'text-[#6b7280] hover:text-[#1a1a1a]'
                }`}
              >
                <List size={16} />
              </button>
            </div>

            {/* 새 기획안 버튼 */}
            <Link href="/plan/new">
              <button className="btn-primary flex items-center gap-2 text-sm">
                <Plus size={16} />
                새 기획안
              </button>
            </Link>
          </div>
        </div>

        {/* 기획안 목록 */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-[#6b7280]">불러오는 중...</div>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-4 border border-[#e8e8e8]">
              <Plus size={32} className="text-[#9ca3af]" />
            </div>
            <h3 className="text-lg font-medium text-[#1a1a1a] mb-2">
              {searchQuery ? '검색 결과가 없습니다' : '아직 기획안이 없습니다'}
            </h3>
            <p className="text-[#6b7280] mb-4">
              {searchQuery ? '다른 검색어를 시도해보세요' : '첫 번째 기획안을 만들어보세요!'}
            </p>
            {!searchQuery && (
              <Link href="/plan/new">
                <button className="btn-primary text-sm">
                  기획안 만들기
                </button>
              </Link>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredPlans.map((plan, index) => (
              <div key={plan.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
                <PlanCard plan={plan} />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPlans.map((plan, index) => (
              <Link key={plan.id} href={`/plan/${plan.id}`}>
                <div 
                  className="flex items-center justify-between p-4 bg-white rounded-xl hover:shadow-md transition-all cursor-pointer border border-[#e8e8e8] animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center gap-4">
                    <span className="tag tag-blue">영상 {plan.videoNumber}번</span>
                    <span className="text-[#1a1a1a] font-medium">{plan.title}</span>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-[#6b7280]">
                    <span>
                      {(plan.sourceCost + plan.productionCost).toLocaleString()}원
                    </span>
                    <span>
                      {new Date(plan.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
