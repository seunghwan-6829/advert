'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Plan, StoryboardItem } from '@/types/plan';
import { getPlanById, updatePlan, deletePlan, createEmptyStoryboardItem, getBrandById } from '@/lib/store';
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  GripVertical,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

function PlanDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = params.id as string;
  const brandIdFromUrl = searchParams.get('brand');

  const [plan, setPlan] = useState<Plan | null>(null);
  const [brandName, setBrandName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const planData = await getPlanById(planId);
      setPlan(planData);
      
      if (planData?.brandId) {
        const brand = await getBrandById(planData.brandId);
        if (brand) {
          setBrandName(brand.name);
        }
      }
      
      setLoading(false);
    };
    loadData();
  }, [planId]);

  const handleSave = async () => {
    if (!plan) return;
    setSaving(true);
    await updatePlan(plan.id, plan);
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!plan) return;
    if (confirm('정말 이 기획안을 삭제하시겠습니까?')) {
      await deletePlan(plan.id);
      router.push(plan.brandId ? `/?brand=${plan.brandId}` : '/');
    }
  };

  const handleTitleChange = (value: string) => {
    if (!plan) return;
    setPlan({ ...plan, title: value });
  };

  const handleAddRow = () => {
    if (!plan) return;
    const newItem = createEmptyStoryboardItem(plan.storyboard.length);
    setPlan({ ...plan, storyboard: [...plan.storyboard, newItem] });
  };

  const handleDeleteRow = (index: number) => {
    if (!plan || plan.storyboard.length <= 1) return;
    const newStoryboard = plan.storyboard.filter((_, i) => i !== index);
    setPlan({
      ...plan,
      storyboard: newStoryboard.map((item, i) => ({ ...item, order: i })),
    });
  };

  const handleUpdateRow = (index: number, field: keyof StoryboardItem, value: string) => {
    if (!plan) return;
    const newStoryboard = [...plan.storyboard];
    newStoryboard[index] = { ...newStoryboard[index], [field]: value };
    setPlan({ ...plan, storyboard: newStoryboard });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f6f2] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-2xl bg-[#fff7ed]">
            <Loader2 size={32} className="text-[#f97316] animate-spin" />
          </div>
          <span className="text-[#6b7280]">불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-[#f8f6f2] flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-[#f0e6dc] p-12 text-center max-w-md">
          <div className="inline-flex p-4 rounded-2xl bg-[#fef2f2] mb-6">
            <AlertTriangle size={40} className="text-[#ef4444]" />
          </div>
          <h2 className="text-xl font-semibold text-[#1a1a1a] mb-3">기획안을 찾을 수 없습니다</h2>
          <p className="text-[#6b7280] mb-6">요청하신 기획안이 존재하지 않거나 삭제되었습니다.</p>
          <Link href="/">
            <button className="btn-primary">
              목록으로 돌아가기
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const backUrl = brandIdFromUrl || plan.brandId ? `/?brand=${brandIdFromUrl || plan.brandId}` : '/';

  return (
    <div className="min-h-screen bg-[#f8f6f2]">
      {/* 상단 네비게이션 */}
      <header className="sticky top-0 z-10 bg-white border-b border-[#f0e6dc] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={backUrl}>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#6b7280] hover:text-[#f97316] hover:bg-[#fff7ed] transition-all">
                <ArrowLeft size={18} />
                <span className="font-medium">돌아가기</span>
              </button>
            </Link>
            {brandName && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#fff7ed] rounded-lg">
                <span className="text-sm text-[#c2410c] font-medium">{brandName}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[#ef4444] hover:bg-[#fef2f2] border border-transparent hover:border-[#fecaca] transition-all"
            >
              <Trash2 size={18} />
              삭제
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {saving ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* 제목 입력 */}
        <div className="mb-8">
          <input
            type="text"
            value={plan.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="text-3xl font-bold bg-transparent border-none outline-none w-full text-[#1a1a1a] placeholder:text-[#d1d5db]"
            placeholder="기획안 제목을 입력하세요"
          />
          <p className="text-sm text-[#9ca3af] mt-2">
            생성일: {new Date(plan.createdAt).toLocaleDateString('ko-KR')}
          </p>
        </div>

        {/* 스토리보드 */}
        <div className="bg-white rounded-2xl border border-[#f0e6dc] overflow-hidden">
          {/* 테이블 헤더 */}
          <div className="grid grid-cols-[40px_1fr_1fr_1fr_40px] bg-[#fafafa] border-b border-[#f0e6dc]">
            <div className="p-4"></div>
            <div className="p-4 text-sm font-semibold text-[#1a1a1a] border-l border-[#f0e6dc]">
              장면 설명
            </div>
            <div className="p-4 text-sm font-semibold text-[#1a1a1a] border-l border-[#f0e6dc]">
              나레이션 / 대사
            </div>
            <div className="p-4 text-sm font-semibold text-[#1a1a1a] border-l border-[#f0e6dc]">
              비고
            </div>
            <div className="p-4"></div>
          </div>

          {/* 스토리보드 행들 */}
          {plan.storyboard.map((item, index) => (
            <div
              key={item.id}
              className="grid grid-cols-[40px_1fr_1fr_1fr_40px] border-b border-[#f0e6dc] last:border-b-0 group hover:bg-[#fafafa] transition-colors"
            >
              {/* 드래그 핸들 */}
              <div className="p-4 flex items-start justify-center text-[#d1d5db] cursor-grab">
                <GripVertical size={16} />
              </div>

              {/* 장면 설명 */}
              <div className="border-l border-[#f0e6dc]">
                <textarea
                  value={item.scene}
                  onChange={(e) => handleUpdateRow(index, 'scene', e.target.value)}
                  placeholder="장면을 설명해주세요..."
                  className="w-full h-full min-h-[120px] p-4 bg-transparent resize-none outline-none text-sm text-[#1a1a1a] placeholder:text-[#d1d5db]"
                />
              </div>

              {/* 나레이션 */}
              <div className="border-l border-[#f0e6dc]">
                <textarea
                  value={item.narration}
                  onChange={(e) => handleUpdateRow(index, 'narration', e.target.value)}
                  placeholder="나레이션이나 대사를 입력하세요..."
                  className="w-full h-full min-h-[120px] p-4 bg-transparent resize-none outline-none text-sm text-[#1a1a1a] placeholder:text-[#d1d5db]"
                />
              </div>

              {/* 비고 */}
              <div className="border-l border-[#f0e6dc]">
                <textarea
                  value={item.note}
                  onChange={(e) => handleUpdateRow(index, 'note', e.target.value)}
                  placeholder="특이사항이나 참고사항..."
                  className="w-full h-full min-h-[120px] p-4 bg-transparent resize-none outline-none text-sm text-[#1a1a1a] placeholder:text-[#d1d5db]"
                />
              </div>

              {/* 삭제 버튼 */}
              <div className="p-4 flex items-start justify-center">
                <button
                  onClick={() => handleDeleteRow(index)}
                  className="p-1 rounded text-[#d1d5db] hover:text-[#ef4444] hover:bg-[#fef2f2] transition-colors opacity-0 group-hover:opacity-100"
                  disabled={plan.storyboard.length <= 1}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          {/* 행 추가 버튼 */}
          <button
            onClick={handleAddRow}
            className="w-full py-4 flex items-center justify-center gap-2 text-[#6b7280] hover:text-[#f97316] hover:bg-[#fff7ed] transition-colors"
          >
            <Plus size={18} />
            <span className="text-sm font-medium">행 추가</span>
          </button>
        </div>
      </main>
    </div>
  );
}

export default function PlanDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
      <PlanDetailContent />
    </Suspense>
  );
}
