'use client';

import { Plan } from '@/types/plan';
import { FileText, ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';

interface PlanCardProps {
  plan: Plan;
  pendingCompleted?: boolean; // 저장되지 않은 완료 상태
  onCompletionChange?: (planId: string, isCompleted: boolean) => void;
}

export default function PlanCard({ plan, pendingCompleted, onCompletionChange }: PlanCardProps) {
  // 스토리보드 첫 번째 장면 가져오기
  const firstScene = plan.storyboard?.[0];
  const sceneCount = plan.storyboard?.length || 0;
  
  // pendingCompleted가 있으면 그 값 사용, 없으면 plan.isCompleted
  const isCompleted = pendingCompleted !== undefined ? pendingCompleted : (plan.isCompleted || false);

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newStatus = !isCompleted;
    onCompletionChange?.(plan.id, newStatus);
  };

  return (
    <Link href={`/plan/${plan.id}?brand=${plan.brandId}`}>
      <div className={`card p-5 cursor-pointer group transition-all duration-300 ${
        isCompleted 
          ? 'border-2 border-[#22c55e] bg-white' 
          : ''
      }`}>
        {/* 상단: 태그 & 완료 버튼 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`tag ${isCompleted ? 'bg-[#dcfce7] text-[#16a34a]' : 'tag-orange'}`}>
              <FileText size={12} />
              {sceneCount}개 장면
            </span>
            {/* 제작 완료 버튼 */}
            <button
              onClick={handleToggleComplete}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                isCompleted
                  ? 'bg-[#22c55e] text-white hover:bg-[#16a34a]'
                  : 'bg-[#f5f5f5] text-[#6b7280] hover:bg-[#e5e5e5]'
              }`}
            >
              <Check size={12} />
              {isCompleted ? '완료됨' : '제작 완료'}
            </button>
          </div>
          <span className="text-xs text-[#9ca3af]">
            {new Date(plan.createdAt).toLocaleDateString('ko-KR')}
          </span>
        </div>

        {/* 제목 */}
        <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2 group-hover:text-[#f97316] transition-colors line-clamp-1">
          {plan.title}
        </h3>

        {/* 미리보기 텍스트 (summary 우선, 없으면 첫 번째 장면) */}
        <p className="text-sm text-[#6b7280] mb-4 line-clamp-2">
          {plan.summary || firstScene?.narration || firstScene?.source || firstScene?.note || '스토리보드 내용이 없습니다.'}
        </p>

        {/* 하단: 자세히 보기 */}
        <div className={`flex items-center justify-end pt-3 border-t ${isCompleted ? 'border-[#bbf7d0]' : 'border-[#f0e6dc]'}`}>
          <span className="flex items-center gap-1 text-sm text-[#f97316] font-medium group-hover:gap-2 transition-all">
            자세히 보기
            <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}
