'use client';

import { Plan } from '@/types/plan';
import { FileText, ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import { updatePlan } from '@/lib/store';
import { useState } from 'react';

interface PlanCardProps {
  plan: Plan;
  onUpdate?: () => void;
}

export default function PlanCard({ plan, onUpdate }: PlanCardProps) {
  // 스토리보드 첫 번째 장면 가져오기
  const firstScene = plan.storyboard?.[0];
  const sceneCount = plan.storyboard?.length || 0;
  const [isCompleted, setIsCompleted] = useState(plan.isCompleted || false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsUpdating(true);
    const newStatus = !isCompleted;
    setIsCompleted(newStatus);
    
    await updatePlan(plan.id, { isCompleted: newStatus });
    onUpdate?.();
    setIsUpdating(false);
  };

  return (
    <Link href={`/plan/${plan.id}?brand=${plan.brandId}`}>
      <div className={`card p-5 cursor-pointer group transition-all duration-300 relative overflow-hidden ${
        isCompleted 
          ? 'border-2 border-[#059669] bg-gradient-to-br from-[#064e3b] to-[#065f46]' 
          : ''
      }`}>
        {/* 완료 배지 */}
        {isCompleted && (
          <div className="absolute top-0 right-0 bg-[#10b981] text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
            ✓ 완료
          </div>
        )}
        
        {/* 상단: 태그 & 완료 버튼 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`tag ${isCompleted ? 'bg-[#10b981] text-white' : 'tag-orange'}`}>
              <FileText size={12} />
              {sceneCount}개 장면
            </span>
            {/* 제작 완료 버튼 */}
            <button
              onClick={handleToggleComplete}
              disabled={isUpdating}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                isCompleted
                  ? 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
                  : 'bg-[#f5f5f5] text-[#6b7280] hover:bg-[#e5e5e5]'
              }`}
            >
              <Check size={12} />
              {isCompleted ? '완료 취소' : '제작 완료'}
            </button>
          </div>
          <span className={`text-xs ${isCompleted ? 'text-white/70' : 'text-[#9ca3af]'}`}>
            {new Date(plan.createdAt).toLocaleDateString('ko-KR')}
          </span>
        </div>

        {/* 제목 */}
        <h3 className={`text-lg font-semibold mb-2 transition-colors line-clamp-1 ${
          isCompleted 
            ? 'text-white' 
            : 'text-[#1a1a1a] group-hover:text-[#f97316]'
        }`}>
          {plan.title}
        </h3>

        {/* 미리보기 텍스트 (summary 우선, 없으면 첫 번째 장면) */}
        <p className={`text-sm mb-4 line-clamp-2 ${isCompleted ? 'text-white/80' : 'text-[#6b7280]'}`}>
          {plan.summary || firstScene?.narration || firstScene?.source || firstScene?.note || '스토리보드 내용이 없습니다.'}
        </p>

        {/* 하단: 자세히 보기 */}
        <div className={`flex items-center justify-end pt-3 border-t ${isCompleted ? 'border-white/20' : 'border-[#f0e6dc]'}`}>
          <span className={`flex items-center gap-1 text-sm font-medium group-hover:gap-2 transition-all ${
            isCompleted ? 'text-[#6ee7b7]' : 'text-[#f97316]'
          }`}>
            자세히 보기
            <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}
