'use client';

import { useEffect, useState } from 'react';
import { Plan } from '@/types/plan';
import { getPlans } from '@/lib/store';
import Sidebar from '@/components/Sidebar';
import PlanCard from '@/components/PlanCard';
import { LayoutGrid, List, Plus } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlans = async () => {
      const data = await getPlans();
      setPlans(data);
      setLoading(false);
    };
    loadPlans();
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* 사이드바 */}
      <Sidebar plans={plans} />

      {/* 메인 콘텐츠 */}
      <main className="flex-1 ml-64 p-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">기획안 관리</h1>
          <p className="text-[#9b9a97]">
            영상 기획안을 효율적으로 관리하세요
          </p>
        </div>

        {/* 툴바 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#9b9a97]">
              총 {plans.length}개의 기획안
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* 뷰 모드 토글 */}
            <div className="flex items-center bg-[#252525] rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${
                  viewMode === 'grid'
                    ? 'bg-[#333] text-white'
                    : 'text-[#9b9a97] hover:text-white'
                }`}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${
                  viewMode === 'list'
                    ? 'bg-[#333] text-white'
                    : 'text-[#9b9a97] hover:text-white'
                }`}
              >
                <List size={18} />
              </button>
            </div>

            {/* 새 기획안 버튼 */}
            <Link href="/plan/new">
              <button className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm">
                <Plus size={18} />
                새 기획안
              </button>
            </Link>
          </div>
        </div>

        {/* 기획안 목록 */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-[#9b9a97]">불러오는 중...</div>
          </div>
        ) : plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-[#252525] rounded-full flex items-center justify-center mb-4">
              <Plus size={32} className="text-[#6b6b6b]" />
            </div>
            <h3 className="text-lg font-medium mb-2">아직 기획안이 없습니다</h3>
            <p className="text-[#9b9a97] mb-4">
              첫 번째 기획안을 만들어보세요!
            </p>
            <Link href="/plan/new">
              <button className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm">
                기획안 만들기
              </button>
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {plans.map((plan) => (
              <Link key={plan.id} href={`/plan/${plan.id}`}>
                <div className="flex items-center justify-between p-4 bg-[#252525] rounded-lg hover:bg-[#2f2f2f] transition-colors cursor-pointer border border-[#333]">
                  <div className="flex items-center gap-4">
                    <span className="text-white font-medium">{plan.title}</span>
                    <span className="text-xs text-[#6b6b6b]">
                      영상 {plan.videoNumber}번
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[#9b9a97]">
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
