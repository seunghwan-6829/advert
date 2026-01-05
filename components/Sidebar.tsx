'use client';

import { Plus, FileText, Settings, Search } from 'lucide-react';
import Link from 'next/link';
import { Plan } from '@/types/plan';

interface SidebarProps {
  plans: Plan[];
  currentPlanId?: string;
}

export default function Sidebar({ plans, currentPlanId }: SidebarProps) {
  return (
    <aside className="w-64 h-screen bg-[#191919] text-[#9b9a97] flex flex-col border-r border-[#2f2f2f] fixed left-0 top-0">
      {/* 헤더 */}
      <div className="p-3 border-b border-[#2f2f2f]">
        <h1 className="text-white font-semibold text-sm flex items-center gap-2">
          <FileText size={18} />
          기획안 관리
        </h1>
      </div>

      {/* 검색 */}
      <div className="p-2">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#2f2f2f] cursor-pointer text-sm">
          <Search size={16} />
          <span>검색</span>
        </div>
      </div>

      {/* 새 기획안 버튼 */}
      <div className="px-2">
        <Link href="/plan/new">
          <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#2f2f2f] text-sm transition-colors">
            <Plus size={16} />
            <span>새 기획안</span>
          </button>
        </Link>
      </div>

      {/* 기획안 목록 */}
      <div className="flex-1 overflow-y-auto mt-2">
        <div className="px-3 py-1 text-xs text-[#6b6b6b] uppercase tracking-wider">
          기획안 목록
        </div>
        <nav className="px-2">
          {plans.length === 0 ? (
            <p className="text-xs text-[#6b6b6b] px-2 py-4">
              아직 기획안이 없습니다
            </p>
          ) : (
            plans.map((plan) => (
              <Link key={plan.id} href={`/plan/${plan.id}`}>
                <div
                  className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm cursor-pointer transition-colors ${
                    currentPlanId === plan.id
                      ? 'bg-[#2f2f2f] text-white'
                      : 'hover:bg-[#2f2f2f]'
                  }`}
                >
                  <FileText size={14} />
                  <span className="truncate">{plan.title}</span>
                </div>
              </Link>
            ))
          )}
        </nav>
      </div>

      {/* 하단 설정 */}
      <div className="p-2 border-t border-[#2f2f2f]">
        <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#2f2f2f] text-sm transition-colors">
          <Settings size={16} />
          <span>설정</span>
        </button>
      </div>
    </aside>
  );
}

