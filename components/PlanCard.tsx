'use client';

import { Plan } from '@/types/plan';
import { FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface PlanCardProps {
  plan: Plan;
}

export default function PlanCard({ plan }: PlanCardProps) {
  // 스토리보드 첫 번째 장면 가져오기
  const firstScene = plan.storyboard?.[0];
  const sceneCount = plan.storyboard?.length || 0;

  return (
    <Link href={`/plan/${plan.id}?brand=${plan.brandId}`}>
      <div className="card p-5 cursor-pointer group">
        {/* 상단: 태그 */}
        <div className="flex items-start justify-between mb-4">
          <span className="tag tag-orange">
            <FileText size={12} />
            {sceneCount}개 장면
          </span>
          <span className="text-xs text-[#9ca3af]">
            {new Date(plan.createdAt).toLocaleDateString('ko-KR')}
          </span>
        </div>

        {/* 제목 */}
        <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2 group-hover:text-[#f97316] transition-colors line-clamp-1">
          {plan.title}
        </h3>

        {/* 첫 번째 장면 미리보기 */}
        <p className="text-sm text-[#6b7280] mb-4 line-clamp-2">
          {firstScene?.scene || firstScene?.narration || '스토리보드 내용이 없습니다.'}
        </p>

        {/* 하단: 자세히 보기 */}
        <div className="flex items-center justify-end pt-3 border-t border-[#f0e6dc]">
          <span className="flex items-center gap-1 text-sm text-[#f97316] font-medium group-hover:gap-2 transition-all">
            자세히 보기
            <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}
