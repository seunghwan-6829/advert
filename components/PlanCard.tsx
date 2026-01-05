'use client';

import { Plan } from '@/types/plan';
import { Calendar, DollarSign, Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface PlanCardProps {
  plan: Plan;
}

export default function PlanCard({ plan }: PlanCardProps) {
  const totalCost = plan.sourceCost + plan.productionCost;
  const formattedDate = new Date(plan.createdAt).toLocaleDateString('ko-KR');

  return (
    <Link href={`/plan/${plan.id}`}>
      <div className="bg-[#252525] rounded-lg p-4 hover:bg-[#2f2f2f] transition-all cursor-pointer border border-[#333] hover:border-[#444] group">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-white font-medium text-base group-hover:text-[#9b9a97] transition-colors">
              {plan.title}
            </h3>
            <span className="text-xs text-[#6b6b6b]">
              영상 {plan.videoNumber}번
            </span>
          </div>
          <span className="px-2 py-0.5 bg-[#2f4f2f] text-[#4ade80] text-xs rounded">
            진행중
          </span>
        </div>

        {/* 정보 */}
        <div className="space-y-2 text-sm text-[#9b9a97]">
          <div className="flex items-center gap-2">
            <DollarSign size={14} className="text-[#6b6b6b]" />
            <span>
              소스 {plan.sourceCost.toLocaleString()}원 / 제작{' '}
              {plan.productionCost.toLocaleString()}원
            </span>
          </div>
          {plan.videoLength && (
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-[#6b6b6b]" />
              <span>{plan.videoLength}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-[#6b6b6b]" />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* 키워드 태그 */}
        {plan.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {plan.keywords.slice(0, 3).map((keyword, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-[#1f1f1f] text-[#9b9a97] text-xs rounded"
              >
                {keyword}
              </span>
            ))}
            {plan.keywords.length > 3 && (
              <span className="text-xs text-[#6b6b6b]">
                +{plan.keywords.length - 3}
              </span>
            )}
          </div>
        )}

        {/* RF 링크 */}
        {plan.rfLink && (
          <div className="mt-3 pt-3 border-t border-[#333]">
            <a
              href={plan.rfLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-[#6b6b6b] hover:text-[#9b9a97] transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={12} />
              RF 링크
            </a>
          </div>
        )}
      </div>
    </Link>
  );
}

