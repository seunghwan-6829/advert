'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { StoryboardItem } from '@/types/plan';
import { createPlan, createEmptyStoryboardItem, getBrandById } from '@/lib/store';
import { ArrowLeft, Save, Plus, Trash2, GripVertical } from 'lucide-react';
import Link from 'next/link';

function NewPlanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const brandId = searchParams.get('brand');
  
  const [brandName, setBrandName] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [storyboard, setStoryboard] = useState<StoryboardItem[]>([
    createEmptyStoryboardItem(0),
  ]);

  useEffect(() => {
    // brandId가 없으면 메인으로 리다이렉트
    if (!brandId) {
      router.push('/');
      return;
    }
    
    // 브랜드 이름 가져오기
    const loadBrand = async () => {
      const brand = await getBrandById(brandId);
      if (brand) {
        setBrandName(brand.name);
      }
    };
    loadBrand();
  }, [brandId, router]);

  const handleSave = async () => {
    if (!title.trim()) {
      alert('기획안 제목을 입력해주세요.');
      return;
    }

    if (!brandId) {
      alert('프로젝트가 선택되지 않았습니다.');
      return;
    }

    setSaving(true);
    await createPlan({
      title,
      brandId,
      storyboard,
    });
    setSaving(false);
    router.push(`/?brand=${brandId}`);
  };

  const handleAddRow = () => {
    setStoryboard([
      ...storyboard,
      createEmptyStoryboardItem(storyboard.length),
    ]);
  };

  const handleDeleteRow = (index: number) => {
    if (storyboard.length <= 1) return;
    const newStoryboard = storyboard.filter((_, i) => i !== index);
    // 순서 재정렬
    setStoryboard(newStoryboard.map((item, i) => ({ ...item, order: i })));
  };

  const handleUpdateRow = (index: number, field: keyof StoryboardItem, value: string) => {
    const newStoryboard = [...storyboard];
    newStoryboard[index] = { ...newStoryboard[index], [field]: value };
    setStoryboard(newStoryboard);
  };

  if (!brandId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f8f6f2]">
      {/* 상단 네비게이션 */}
      <header className="sticky top-0 z-10 bg-white border-b border-[#f0e6dc] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/?brand=${brandId}`}>
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

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* 제목 입력 */}
        <div className="mb-8">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-3xl font-bold bg-transparent border-none outline-none w-full text-[#1a1a1a] placeholder:text-[#d1d5db]"
            placeholder="기획안 제목을 입력하세요"
            autoFocus
          />
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
          {storyboard.map((item, index) => (
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
                  disabled={storyboard.length <= 1}
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

export default function NewPlanPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
      <NewPlanContent />
    </Suspense>
  );
}
