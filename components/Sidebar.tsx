'use client';

import { Plus, FileText, Settings, Home, LogOut, FolderKanban } from 'lucide-react';
import Link from 'next/link';
import { Plan } from '@/types/plan';

interface SidebarProps {
  plans: Plan[];
  currentPlanId?: string;
}

export default function Sidebar({ plans, currentPlanId }: SidebarProps) {
  return (
    <aside className="w-60 h-screen bg-white flex flex-col border-r border-[#e8e8e8] fixed left-0 top-0">
      {/* 로고 영역 */}
      <div className="p-4 border-b border-[#e8e8e8]">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-[#1a1a1a]">여기에 로고 넣기</span>
        </div>
        <Link href="/">
          <div className="flex items-center gap-2 mt-2 text-sm text-[#6b7280] hover:text-[#1a1a1a] transition-colors cursor-pointer">
            <Home size={16} />
            <span>(홈 아이콘) 홈</span>
          </div>
        </Link>
      </div>

      {/* 회원가입/로그인 버튼 */}
      <div className="p-3 flex gap-2">
        <button className="flex-1 py-2 px-3 bg-[#3b82f6] text-white text-sm font-medium rounded-lg hover:bg-[#2563eb] transition-colors">
          회원가입
        </button>
        <button className="flex-1 py-2 px-3 bg-white border border-[#e8e8e8] text-[#1a1a1a] text-sm font-medium rounded-lg hover:bg-[#f3f4f6] transition-colors">
          로그인
        </button>
      </div>

      {/* 프로젝트 관리 */}
      <div className="px-3 pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[#1a1a1a] flex items-center gap-2">
            <FolderKanban size={16} />
            프로젝트 관리
          </span>
          <Link href="/plan/new">
            <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#f3f4f6] text-[#6b7280] hover:text-[#1a1a1a] transition-colors">
              <Plus size={16} />
            </button>
          </Link>
        </div>
      </div>

      {/* 기획안 목록 */}
      <div className="flex-1 overflow-y-auto px-3">
        <nav className="space-y-1">
          {plans.length === 0 ? (
            <p className="text-xs text-[#9ca3af] px-2 py-4">
              아직 기획안이 없습니다
            </p>
          ) : (
            plans.map((plan) => (
              <Link key={plan.id} href={`/plan/${plan.id}`}>
                <div
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                    currentPlanId === plan.id
                      ? 'bg-[#eff6ff] text-[#3b82f6]'
                      : 'text-[#4b5563] hover:bg-[#f3f4f6]'
                  }`}
                >
                  <div className={`w-3 h-3 rounded border-2 ${
                    currentPlanId === plan.id 
                      ? 'border-[#3b82f6] bg-[#3b82f6]' 
                      : 'border-[#d1d5db]'
                  }`} />
                  <span className="truncate">{plan.title}</span>
                </div>
              </Link>
            ))
          )}
        </nav>
      </div>

      {/* 하단 메뉴 */}
      <div className="p-3 border-t border-[#e8e8e8] space-y-1">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#4b5563] hover:bg-[#f3f4f6] transition-colors">
          <Settings size={16} />
          <span>관리자 전용 페이지</span>
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white bg-[#3b82f6] hover:bg-[#2563eb] transition-colors">
          <LogOut size={16} />
          <span>로그아웃</span>
        </button>
      </div>
    </aside>
  );
}
