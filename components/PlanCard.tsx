'use client';

import { Plan } from '@/types/plan';
import { Star, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface PlanCardProps {
  plan: Plan;
}

export default function PlanCard({ plan }: PlanCardProps) {
  const totalCost = plan.sourceCost + plan.productionCost;
  
  // 비용에 따른 별점 계산 (예시: 최대 3개)
  const getStarRating = () => {
    if (totalCost >= 100000) return 3;
    if (totalCost >= 50000) return 2;
    return 1;
  };
  
  const starRating = getStarRating();

  return (
    <Link href={`/plan/${plan.id}`}>
      <div className="card p-5 cursor-pointer group">
        {/* 상단: 태그 + 아이콘 */}
        <div className="flex items-start justify-between mb-4">
          <span className="tag tag-orange">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f97316]" />
            영상 {plan.videoNumber}번
          </span>
          <div className="flex items-center gap-1">
            <button className="icon-btn" onClick={(e) => e.preventDefault()}>
              <Star size={18} />
            </button>
            <button className="icon-btn" onClick={(e) => e.preventDefault()}>
              <CheckCircle size={18} />
            </button>
          </div>
        </div>

        {/* 제목 */}
        <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2 group-hover:text-[#f97316] transition-colors">
          {plan.title}
        </h3>

        {/* 설명 */}
        <p className="text-sm text-[#6b7280] mb-4 line-clamp-2">
          {plan.referenceNote || '소스 비용 ' + plan.sourceCost.toLocaleString() + '원, 제작 비용 ' + plan.productionCost.toLocaleString() + '원의 기획안입니다.'}
        </p>

        {/* 키워드 태그 */}
        {plan.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {plan.keywords.slice(0, 2).map((keyword, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-[#fff7ed] text-[#c2410c] text-xs rounded-full border border-[#fed7aa]"
              >
                {keyword}
              </span>
            ))}
            {plan.keywords.length > 2 && (
              <span className="text-xs text-[#9ca3af]">
                +{plan.keywords.length - 2}
              </span>
            )}
          </div>
        )}

        {/* 하단: 별점 + 자세히 보기 */}
        <div className="flex items-center justify-between pt-3 border-t border-[#f0e6dc]">
          <div className="flex items-center gap-2">
            <div className="stars">
              {[1, 2, 3].map((i) => (
                <Star
                  key={i}
                  size={14}
                  className={i <= starRating ? 'star fill-current' : 'star-empty'}
                />
              ))}
            </div>
            <span className="text-xs text-[#6b7280]">
              비용: {totalCost >= 100000 ? '상' : totalCost >= 50000 ? '중' : '하'}
            </span>
          </div>
          <span className="flex items-center gap-1 text-sm text-[#f97316] font-medium group-hover:gap-2 transition-all">
            자세히 보기
            <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}
