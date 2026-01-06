'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { StoryboardItem } from '@/types/plan';
import { createPlan, createEmptyStoryboardItem, getBrandById } from '@/lib/store';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Upload, 
  Download,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import Link from 'next/link';

// 기본 행 높이 설정
const DEFAULT_ROW_HEIGHTS = {
  image: 180,    // 영상 - 더 크게
  source: 80,    // 소스
  effect: 80,    // 효과
  note: 60,      // 특이사항 - 더 작게
  narration: 100, // 대본
};

function NewPlanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const brandId = searchParams.get('brand');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingColumn, setUploadingColumn] = useState<number | null>(null);
  
  const [brandName, setBrandName] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [storyboard, setStoryboard] = useState<StoryboardItem[]>([
    createEmptyStoryboardItem(0),
  ]);

  // 행 높이 상태
  const [rowHeights, setRowHeights] = useState(DEFAULT_ROW_HEIGHTS);
  const [resizing, setResizing] = useState<string | null>(null);
  const startY = useRef(0);
  const startHeight = useRef(0);

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

  // 리사이즈 핸들러
  const handleResizeStart = (rowKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    setResizing(rowKey);
    startY.current = e.clientY;
    startHeight.current = rowHeights[rowKey as keyof typeof rowHeights];
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing) return;
      const diff = e.clientY - startY.current;
      const newHeight = Math.max(40, Math.min(300, startHeight.current + diff));
      setRowHeights(prev => ({ ...prev, [resizing]: newHeight }));
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing]);

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

  const handleAddColumn = () => {
    setStoryboard([
      ...storyboard,
      createEmptyStoryboardItem(storyboard.length),
    ]);
  };

  const handleDeleteColumn = (index: number) => {
    if (storyboard.length <= 1) return;
    const newStoryboard = storyboard.filter((_, i) => i !== index);
    setStoryboard(newStoryboard.map((item, i) => ({ ...item, order: i })));
  };

  const handleUpdateColumn = (index: number, field: keyof StoryboardItem, value: string) => {
    const newStoryboard = [...storyboard];
    newStoryboard[index] = { ...newStoryboard[index], [field]: value };
    setStoryboard(newStoryboard);
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = (index: number) => {
    setUploadingColumn(index);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploadingColumn === null) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      handleUpdateColumn(uploadingColumn, 'image', base64);
      setUploadingColumn(null);
    };
    reader.readAsDataURL(file);
    
    e.target.value = '';
  };

  // 이미지 다운로드 핸들러
  const handleImageDownload = (image: string, index: number) => {
    const link = document.createElement('a');
    link.href = image;
    link.download = `scene_${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 이미지 삭제 핸들러
  const handleImageDelete = (index: number) => {
    handleUpdateColumn(index, 'image', '');
  };

  if (!brandId) {
    return null;
  }

  // 행 라벨 (색깔 제거)
  const rowLabels = [
    { key: 'image', label: '영상' },
    { key: 'source', label: '소스' },
    { key: 'effect', label: '효과' },
    { key: 'note', label: '특이사항' },
    { key: 'narration', label: '대본\n(나레이션)' },
  ];

  return (
    <div className="min-h-screen bg-[#f8f6f2]">
      {/* 숨겨진 파일 입력 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* 상단 네비게이션 */}
      <header className="sticky top-0 z-10 bg-white border-b border-[#f0e6dc] px-6 py-4">
        <div className="max-w-full mx-auto flex items-center justify-between">
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
      <main className="px-6 py-8">
        {/* 제목 입력 */}
        <div className="mb-8 max-w-4xl">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-3xl font-bold bg-transparent border-none outline-none w-full text-[#1a1a1a] placeholder:text-[#d1d5db]"
            placeholder="기획안 제목을 입력하세요"
            autoFocus
          />
        </div>

        {/* 가로 스크롤 스토리보드 */}
        <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
          <div className="overflow-x-auto storyboard-scroll">
            <div className="inline-flex min-w-full">
              {/* 행 라벨 (고정) */}
              <div className="sticky left-0 z-10 bg-white border-r border-[#e5e7eb] flex-shrink-0 w-28">
                {/* 빈 헤더 셀 */}
                <div className="h-12 border-b border-[#e5e7eb]"></div>
                
                {/* 행 라벨들 */}
                {rowLabels.map((row) => (
                  <div
                    key={row.key}
                    className="relative border-b border-[#e5e7eb] bg-[#fafafa]"
                    style={{ height: rowHeights[row.key as keyof typeof rowHeights] }}
                  >
                    <div className="flex items-center justify-center h-full px-2">
                      <span className="text-sm font-semibold text-[#374151] text-center whitespace-pre-line">
                        {row.label}
                      </span>
                    </div>
                    {/* 리사이즈 핸들 */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-[#f97316]/20 group flex items-center justify-center"
                      onMouseDown={(e) => handleResizeStart(row.key, e)}
                    >
                      <div className="w-8 h-1 rounded-full bg-[#d1d5db] group-hover:bg-[#f97316] transition-colors" />
                    </div>
                  </div>
                ))}
              </div>

              {/* 스토리보드 열들 */}
              {storyboard.map((item, index) => (
                <div key={item.id} className="flex-shrink-0 w-64 border-r border-[#e5e7eb] last:border-r-0">
                  {/* 열 헤더 (번호 + 삭제) */}
                  <div className="h-12 flex items-center justify-between px-3 border-b border-[#e5e7eb] bg-[#fafafa]">
                    <span className="text-sm font-semibold text-[#1a1a1a]">#{index + 1}</span>
                    <button
                      onClick={() => handleDeleteColumn(index)}
                      className="p-1 rounded text-[#d1d5db] hover:text-[#ef4444] hover:bg-[#fef2f2] transition-colors"
                      disabled={storyboard.length <= 1}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* 영상/이미지 */}
                  <div 
                    className="border-b border-[#e5e7eb] relative group"
                    style={{ height: rowHeights.image }}
                  >
                    {item.image ? (
                      <div className="relative w-full h-full">
                        <img
                          src={item.image}
                          alt={`Scene ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {/* 호버 시 액션 버튼 */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleImageDownload(item.image!, index)}
                            className="p-2 bg-white rounded-lg text-[#1a1a1a] hover:bg-[#f5f5f5]"
                            title="다운로드"
                          >
                            <Download size={18} />
                          </button>
                          <button
                            onClick={() => handleImageUpload(index)}
                            className="p-2 bg-white rounded-lg text-[#1a1a1a] hover:bg-[#f5f5f5]"
                            title="변경"
                          >
                            <Upload size={18} />
                          </button>
                          <button
                            onClick={() => handleImageDelete(index)}
                            className="p-2 bg-white rounded-lg text-[#ef4444] hover:bg-[#fef2f2]"
                            title="삭제"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleImageUpload(index)}
                        className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#9ca3af] hover:text-[#f97316] hover:bg-[#fff7ed] transition-colors"
                      >
                        <ImageIcon size={24} />
                        <span className="text-xs">이미지 업로드</span>
                      </button>
                    )}
                  </div>

                  {/* 소스 */}
                  <div 
                    className="border-b border-[#e5e7eb]"
                    style={{ height: rowHeights.source }}
                  >
                    <textarea
                      value={item.source || ''}
                      onChange={(e) => handleUpdateColumn(index, 'source', e.target.value)}
                      placeholder="소스..."
                      className="w-full h-full p-3 bg-transparent resize-none outline-none text-sm text-[#1a1a1a] placeholder:text-[#d1d5db]"
                    />
                  </div>

                  {/* 효과 */}
                  <div 
                    className="border-b border-[#e5e7eb]"
                    style={{ height: rowHeights.effect }}
                  >
                    <textarea
                      value={item.effect || ''}
                      onChange={(e) => handleUpdateColumn(index, 'effect', e.target.value)}
                      placeholder="효과..."
                      className="w-full h-full p-3 bg-transparent resize-none outline-none text-sm text-[#1a1a1a] placeholder:text-[#d1d5db]"
                    />
                  </div>

                  {/* 특이사항 */}
                  <div 
                    className="border-b border-[#e5e7eb]"
                    style={{ height: rowHeights.note }}
                  >
                    <textarea
                      value={item.note}
                      onChange={(e) => handleUpdateColumn(index, 'note', e.target.value)}
                      placeholder="특이사항..."
                      className="w-full h-full p-3 bg-transparent resize-none outline-none text-sm text-[#1a1a1a] placeholder:text-[#d1d5db]"
                    />
                  </div>

                  {/* 대본/나레이션 */}
                  <div 
                    className="border-b border-[#e5e7eb]"
                    style={{ height: rowHeights.narration }}
                  >
                    <textarea
                      value={item.narration}
                      onChange={(e) => handleUpdateColumn(index, 'narration', e.target.value)}
                      placeholder="대본/나레이션..."
                      className="w-full h-full p-3 bg-transparent resize-none outline-none text-sm text-[#1a1a1a] placeholder:text-[#d1d5db]"
                    />
                  </div>
                </div>
              ))}

              {/* 열 추가 버튼 */}
              <div className="flex-shrink-0 w-20 flex items-center justify-center bg-[#fafafa]">
                <button
                  onClick={handleAddColumn}
                  className="w-12 h-12 flex items-center justify-center rounded-xl text-[#6b7280] hover:text-[#f97316] hover:bg-[#fff7ed] border-2 border-dashed border-[#e5e7eb] hover:border-[#f97316] transition-all"
                >
                  <Plus size={24} />
                </button>
              </div>
            </div>
          </div>
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
