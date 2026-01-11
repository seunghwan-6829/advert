'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Plan, StoryboardItem, RowHeights, RowType, DEFAULT_ROW_ORDER, SourceFile } from '@/types/plan';
import { getPlanById, updatePlan, deletePlan, createEmptyStoryboardItem, getBrandById } from '@/lib/store';
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  Loader2,
  AlertTriangle,
  Upload,
  Download,
  X,
  Image as ImageIcon,
  FileDown,
  FileSpreadsheet,
  FileText,
  GripVertical,
  File,
} from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

// 기본 행 높이 설정
const DEFAULT_ROW_HEIGHTS = {
  image: 240,    // 영상 - 더 크게
  timeline: 80,  // 영상 타임라인
  source: 80,
  effect: 60,    // 효과 - 살짝 줄임
  note: 60,
  narration: 100,
};

function PlanDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = params.id as string;
  const brandIdFromUrl = searchParams.get('brand');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sourceFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingColumn, setUploadingColumn] = useState<number | null>(null);
  const [uploadingSourceIndex, setUploadingSourceIndex] = useState<number | null>(null);

  const [plan, setPlan] = useState<Plan | null>(null);
  const [originalPlan, setOriginalPlan] = useState<Plan | null>(null);
  const [brandName, setBrandName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showTndModal, setShowTndModal] = useState(false);
  
  const [rowHeights, setRowHeights] = useState(DEFAULT_ROW_HEIGHTS);
  const [rowOrder, setRowOrder] = useState<RowType[]>(DEFAULT_ROW_ORDER);
  const [resizing, setResizing] = useState<string | null>(null);
  const startY = useRef(0);
  const startHeight = useRef(0);
  
  // 행 드래그 앤 드롭 상태
  const [draggedRow, setDraggedRow] = useState<RowType | null>(null);
  const [dragOverRow, setDragOverRow] = useState<RowType | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const planData = await getPlanById(planId);
      setPlan(planData);
      setOriginalPlan(planData ? JSON.parse(JSON.stringify(planData)) : null);
      
      // 저장된 행 높이가 있으면 불러오기
      if (planData?.rowHeights) {
        setRowHeights({ ...DEFAULT_ROW_HEIGHTS, ...planData.rowHeights });
      }
      
      // 저장된 행 순서가 있으면 불러오기
      if (planData?.rowOrder) {
        setRowOrder(planData.rowOrder);
      }
      
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

  const hasUnsavedChanges = () => {
    if (!plan || !originalPlan) return false;
    // plan 비교 + rowHeights + rowOrder 비교
    const planChanged = JSON.stringify(plan) !== JSON.stringify(originalPlan);
    const heightsChanged = JSON.stringify(rowHeights) !== JSON.stringify(originalPlan.rowHeights || DEFAULT_ROW_HEIGHTS);
    const orderChanged = JSON.stringify(rowOrder) !== JSON.stringify(originalPlan.rowOrder || DEFAULT_ROW_ORDER);
    return planChanged || heightsChanged || orderChanged;
  };

  // 행 드래그 핸들러
  const handleRowDragStart = (e: React.DragEvent, rowKey: RowType) => {
    setDraggedRow(rowKey);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleRowDragEnd = () => {
    setDraggedRow(null);
    setDragOverRow(null);
  };

  const handleRowDragOver = (e: React.DragEvent, rowKey: RowType) => {
    e.preventDefault();
    if (draggedRow && draggedRow !== rowKey) {
      setDragOverRow(rowKey);
    }
  };

  const handleRowDragLeave = () => {
    setDragOverRow(null);
  };

  const handleRowDrop = (e: React.DragEvent, targetRow: RowType) => {
    e.preventDefault();
    if (!draggedRow || draggedRow === targetRow) {
      setDraggedRow(null);
      setDragOverRow(null);
      return;
    }

    const newOrder = [...rowOrder];
    const draggedIndex = newOrder.indexOf(draggedRow);
    const targetIndex = newOrder.indexOf(targetRow);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedRow);
      setRowOrder(newOrder);
    }

    setDraggedRow(null);
    setDragOverRow(null);
  };

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
      const newHeight = Math.max(40, Math.min(400, startHeight.current + diff));
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
    if (!plan) return;
    setSaving(true);
    // rowHeights, rowOrder 함께 저장
    const planToSave = { ...plan, rowHeights, rowOrder };
    await updatePlan(plan.id, planToSave);
    setPlan(planToSave);
    setOriginalPlan(JSON.parse(JSON.stringify(planToSave)));
    setSaving(false);
  };

  const handleSaveAndExit = async () => {
    if (!plan) return;
    setSaving(true);
    // rowHeights, rowOrder 함께 저장
    const planToSave = { ...plan, rowHeights, rowOrder };
    await updatePlan(plan.id, planToSave);
    setSaving(false);
    setShowUnsavedModal(false);
    router.push(backUrl);
  };

  const handleBack = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedModal(true);
    } else {
      router.push(backUrl);
    }
  };

  // 엑셀로 내보내기
  const handleExportExcel = () => {
    if (!plan) return;
    
    const data = plan.storyboard.map((item, index) => ({
      '번호': index + 1,
      '타임라인': item.timeline || '',
      '소스': item.source || '',
      '효과': item.effect || '',
      '특이사항': item.note || '',
      '대본(나레이션)': item.narration || '',
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '스토리보드');
    
    // 기본 정보 시트 추가
    const infoData = [
      { '항목': '제목', '내용': plan.title },
      { '항목': '레퍼런스', '내용': plan.reference || '' },
      { '항목': 'CTA 문장', '내용': plan.ctaText || '' },
      { '항목': '카드 미리보기', '내용': plan.summary || '' },
      { '항목': '생성일', '내용': new Date(plan.createdAt).toLocaleDateString('ko-KR') },
    ];
    const infoWs = XLSX.utils.json_to_sheet(infoData);
    XLSX.utils.book_append_sheet(wb, infoWs, '기본정보');
    
    XLSX.writeFile(wb, `${plan.title}_기획안.xlsx`);
    setShowExportModal(false);
  };

  // 텍스트 파일로 내보내기
  const handleExportTXT = () => {
    if (!plan) return;
    
    setShowExportModal(false);
    
    // 텍스트 내용 생성
    let content = '';
    content += `═══════════════════════════════════════════════════════════════\n`;
    content += `📋 ${plan.title}\n`;
    content += `═══════════════════════════════════════════════════════════════\n\n`;
    
    // 기본 정보
    content += `📅 작성일: ${new Date(plan.createdAt).toLocaleDateString('ko-KR')}\n`;
    content += `🎬 장면 수: ${plan.storyboard.length}개\n`;
    if (plan.reference) content += `🔗 레퍼런스: ${plan.reference}\n`;
    if (plan.ctaText) content += `💬 CTA 문장: ${plan.ctaText}\n`;
    if (plan.summary) content += `📝 요약: ${plan.summary}\n`;
    
    content += `\n───────────────────────────────────────────────────────────────\n`;
    content += `                         스토리보드\n`;
    content += `───────────────────────────────────────────────────────────────\n\n`;
    
    // 스토리보드 내용
    plan.storyboard.forEach((item, index) => {
      content += `┌─────────────────────────────────────────────────────────────┐\n`;
      content += `│  #${index + 1} 장면\n`;
      content += `├─────────────────────────────────────────────────────────────┤\n`;
      
      if (item.timeline) content += `│  ⏱️ 타임라인: ${item.timeline}\n`;
      if (item.source) content += `│  📁 소스: ${item.source}\n`;
      if (item.effect) content += `│  ✨ 효과: ${item.effect}\n`;
      if (item.note) content += `│  📌 특이사항: ${item.note}\n`;
      if (item.narration) content += `│  🎙️ 대본: ${item.narration}\n`;
      
      content += `└─────────────────────────────────────────────────────────────┘\n\n`;
    });
    
    content += `═══════════════════════════════════════════════════════════════\n`;
    content += `                    기획안 내보내기 완료\n`;
    content += `═══════════════════════════════════════════════════════════════\n`;
    
    // 파일 다운로드
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${plan.title}_기획안.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  const handleAddColumn = () => {
    if (!plan) return;
    const newItem = createEmptyStoryboardItem(plan.storyboard.length);
    setPlan({ ...plan, storyboard: [...plan.storyboard, newItem] });
  };

  const handleDeleteColumn = (index: number) => {
    if (!plan || plan.storyboard.length <= 1) return;
    const newStoryboard = plan.storyboard.filter((_, i) => i !== index);
    setPlan({
      ...plan,
      storyboard: newStoryboard.map((item, i) => ({ ...item, order: i })),
    });
  };

  const handleUpdateColumn = (index: number, field: keyof StoryboardItem, value: string) => {
    if (!plan) return;
    const newStoryboard = [...plan.storyboard];
    newStoryboard[index] = { ...newStoryboard[index], [field]: value };
    setPlan({ ...plan, storyboard: newStoryboard });
  };

  const handleImageUpload = (index: number) => {
    setUploadingColumn(index);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploadingColumn === null || !plan) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      handleUpdateColumn(uploadingColumn, 'image', base64);
      setUploadingColumn(null);
    };
    reader.readAsDataURL(file);
    
    e.target.value = '';
  };

  const handleImageDownload = (image: string, index: number) => {
    const link = document.createElement('a');
    link.href = image;
    link.download = `scene_${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageDelete = (index: number) => {
    handleUpdateColumn(index, 'image', '');
  };

  // 소스 파일 업로드 (columnIndex: 스토리보드 열 인덱스, fileIndex: 소스 파일 인덱스 0-2)
  const [uploadingSourceColumn, setUploadingSourceColumn] = useState<number | null>(null);
  
  const handleSourceFileUpload = (columnIndex: number, fileIndex: number) => {
    setUploadingSourceColumn(columnIndex);
    setUploadingSourceIndex(fileIndex);
    sourceFileInputRef.current?.click();
  };

  const handleSourceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploadingSourceIndex === null || uploadingSourceColumn === null || !plan) return;

    // 5MB 제한
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const newStoryboard = [...plan.storyboard];
      const item = { ...newStoryboard[uploadingSourceColumn] };
      const sourceFiles = item.sourceFiles ? [...item.sourceFiles] : [null, null, null];
      sourceFiles[uploadingSourceIndex] = {
        name: file.name,
        data: reader.result as string,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      };
      item.sourceFiles = sourceFiles;
      newStoryboard[uploadingSourceColumn] = item;
      setPlan({ ...plan, storyboard: newStoryboard });
      setUploadingSourceIndex(null);
      setUploadingSourceColumn(null);
    };
    reader.readAsDataURL(file);
    
    e.target.value = '';
  };

  const handleSourceFileDownload = (sourceFile: SourceFile) => {
    const link = document.createElement('a');
    link.href = sourceFile.data;
    link.download = sourceFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSourceFileDelete = (columnIndex: number, fileIndex: number) => {
    if (!plan) return;
    const newStoryboard = [...plan.storyboard];
    const item = { ...newStoryboard[columnIndex] };
    const sourceFiles = item.sourceFiles ? [...item.sourceFiles] : [null, null, null];
    sourceFiles[fileIndex] = null;
    item.sourceFiles = sourceFiles;
    newStoryboard[columnIndex] = item;
    setPlan({ ...plan, storyboard: newStoryboard });
  };

  // 파일 크기 포맷
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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

  // 행 라벨 정의
  const rowLabelMap: Record<RowType, string> = {
    image: '영상',
    timeline: '타임라인',
    source: '소스',
    effect: '효과',
    note: '특이사항',
    narration: '대본\n(나레이션)',
  };

  // rowOrder 기반으로 동적 생성
  const rowLabels = rowOrder.map(key => ({
    key,
    label: rowLabelMap[key],
  }));

  return (
    <div className="min-h-screen bg-[#f8f6f2]">
      {/* 저장 안됨 모달 */}
      {showUnsavedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-10 max-w-lg w-full mx-4 shadow-2xl">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="p-4 rounded-2xl bg-[#fef3c7] mb-5">
                <AlertTriangle size={32} className="text-[#f59e0b]" />
              </div>
              <h3 className="text-2xl font-bold text-[#1a1a1a] mb-3">저장되지 않음</h3>
              <p className="text-[#6b7280] text-base leading-relaxed">
                변경사항이 저장되지 않았습니다.<br />저장하지 않고 나가시겠습니까?
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowUnsavedModal(false)}
                className="flex-1 px-5 py-3.5 rounded-xl border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb] transition-colors font-semibold text-base"
              >
                취소
              </button>
              <button
                onClick={() => {
                  setShowUnsavedModal(false);
                  router.push(backUrl);
                }}
                className="flex-1 px-5 py-3.5 rounded-xl border border-[#fecaca] text-[#ef4444] hover:bg-[#fef2f2] transition-colors font-semibold text-base"
              >
                나가기
              </button>
              <button
                onClick={handleSaveAndExit}
                disabled={saving}
                className="flex-1 px-5 py-3.5 rounded-xl bg-[#f97316] text-white hover:bg-[#ea580c] transition-colors disabled:opacity-50 font-semibold text-base"
              >
                {saving ? '저장 중...' : '저장하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 내보내기 모달 */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#1a1a1a]">내보내기</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-2 hover:bg-[#f5f5f5] rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-[#6b7280] mb-6">
              기획안을 어떤 형식으로 내보내시겠습니까?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-[#e5e7eb] hover:border-[#22c55e] hover:bg-[#f0fdf4] transition-all"
              >
                <FileSpreadsheet size={22} className="text-[#22c55e]" />
                <div className="text-left">
                  <div className="font-semibold text-[#1a1a1a]">Excel 파일</div>
                  <div className="text-xs text-[#6b7280]">.xlsx 형식으로 저장</div>
                </div>
              </button>
              <button
                onClick={handleExportTXT}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-[#e5e7eb] hover:border-[#6b7280] hover:bg-[#f5f5f5] transition-all"
              >
                <FileText size={22} className="text-[#6b7280]" />
                <div className="text-left">
                  <div className="font-semibold text-[#1a1a1a]">텍스트 파일</div>
                  <div className="text-xs text-[#6b7280]">.txt 형식으로 저장</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* T&D 모달 */}
      {showTndModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#1a1a1a]">T&D 정보</h3>
              <button
                onClick={() => setShowTndModal(false)}
                className="p-2 hover:bg-[#f5f5f5] rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#6b7280] mb-2">제목</label>
                <input
                  type="text"
                  value={plan?.tndTitle || ''}
                  onChange={(e) => plan && setPlan({ ...plan, tndTitle: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-white text-sm focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 outline-none transition-all"
                  placeholder="T&D 제목 입력..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6b7280] mb-2">설명</label>
                <textarea
                  value={plan?.tndDescription || ''}
                  onChange={(e) => plan && setPlan({ ...plan, tndDescription: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-white text-sm focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 outline-none transition-all resize-none"
                  placeholder="T&D 설명 입력..."
                />
              </div>
            </div>
            <p className="text-xs text-[#9ca3af] mt-4">
              * T&D 정보는 기획안 저장 시 함께 저장됩니다.
            </p>
          </div>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      {/* 소스 파일 업로드용 hidden input */}
      <input
        type="file"
        ref={sourceFileInputRef}
        onChange={handleSourceFileChange}
        className="hidden"
      />

      {/* 상단 네비게이션 */}
      <header className="sticky top-0 z-10 bg-white border-b border-[#f0e6dc] px-[8%] py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#6b7280] hover:text-[#f97316] hover:bg-[#fff7ed] transition-all"
            >
              <ArrowLeft size={18} />
              <span className="font-medium">돌아가기</span>
            </button>
            {brandName && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#fff7ed] rounded-lg">
                <span className="text-sm text-[#c2410c] font-medium">{brandName}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTndModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[#8b5cf6] hover:bg-[#f5f3ff] border border-[#e5e7eb] transition-all font-semibold"
            >
              T&D
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[#6b7280] hover:bg-[#f5f5f5] border border-[#e5e7eb] transition-all"
            >
              <FileDown size={18} />
              내보내기
            </button>
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

      {/* 메인 콘텐츠 - 좌우 8% 여백 */}
      <main className="px-[8%] py-8">
        {/* 상단 정보 영역 */}
        <div className="mb-8 flex justify-between items-start gap-8">
          {/* 왼쪽: 제목 */}
          <div className="flex-1">
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
          
          {/* 오른쪽: 레퍼런스 & CTA 문장 & 카드 미리보기 */}
          <div className="flex gap-4 flex-shrink-0">
            <div className="w-64">
              <label className="block text-sm font-medium text-[#6b7280] mb-2">레퍼런스</label>
              <input
                type="text"
                value={plan.reference || ''}
                onChange={(e) => setPlan({ ...plan, reference: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-white text-sm focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20 outline-none transition-all"
                placeholder="레퍼런스 입력..."
              />
            </div>
            <div className="w-64">
              <label className="block text-sm font-medium text-[#6b7280] mb-2">CTA 문장</label>
              <input
                type="text"
                value={plan.ctaText || ''}
                onChange={(e) => setPlan({ ...plan, ctaText: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-white text-sm focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20 outline-none transition-all"
                placeholder="CTA 문장 입력..."
              />
            </div>
            <div className="w-64">
              <label className="block text-sm font-medium text-[#6b7280] mb-2">카드 미리보기</label>
              <input
                type="text"
                value={plan.summary || ''}
                onChange={(e) => setPlan({ ...plan, summary: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-white text-sm focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20 outline-none transition-all"
                placeholder="카드에 표시될 설명..."
              />
            </div>
          </div>
        </div>

        {/* 가로 스크롤 스토리보드 */}
        <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
          <div className="overflow-x-auto storyboard-scroll">
            <div className="inline-flex min-w-full">
              {/* 행 라벨 (고정) */}
              <div className="sticky left-0 z-10 bg-white border-r border-[#e5e7eb] flex-shrink-0 w-28">
                <div className="h-12 border-b border-[#e5e7eb]"></div>
                
                {rowLabels.map((row) => (
                  <div
                    key={row.key}
                    draggable
                    onDragStart={(e) => handleRowDragStart(e, row.key)}
                    onDragEnd={handleRowDragEnd}
                    onDragOver={(e) => handleRowDragOver(e, row.key)}
                    onDragLeave={handleRowDragLeave}
                    onDrop={(e) => handleRowDrop(e, row.key)}
                    className={`relative border-b border-[#e5e7eb] transition-all duration-200 ${
                      row.key === 'narration' ? 'bg-[#f5efe6]' : 'bg-[#fafafa]'
                    } ${draggedRow === row.key ? 'opacity-50' : ''} ${
                      dragOverRow === row.key ? 'border-t-2 border-t-[#f97316]' : ''
                    }`}
                    style={{ height: rowHeights[row.key as keyof typeof rowHeights] }}
                  >
                    <div className="flex items-center h-full px-2 gap-1">
                      {/* 드래그 핸들 */}
                      <div className="cursor-grab active:cursor-grabbing text-[#9ca3af] hover:text-[#6b7280]">
                        <GripVertical size={14} />
                      </div>
                      <span className="text-sm font-semibold text-[#374151] text-center whitespace-pre-line flex-1">
                        {row.label}
                      </span>
                    </div>
                    {/* 리사이즈 핸들 - 투명하게 (디자인 제거) */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize hover:bg-[#f97316]/10"
                      onMouseDown={(e) => handleResizeStart(row.key, e)}
                    />
                  </div>
                ))}
                {/* 소스 파일 레이블 */}
                <div className="h-[100px] flex items-center justify-center border-b border-[#e5e7eb] bg-[#fafafa]">
                  <span className="text-sm font-semibold text-[#374151]">소스</span>
                </div>
              </div>

              {/* 스토리보드 열들 */}
              {plan.storyboard.map((item, index) => (
                <div key={item.id} className="flex-shrink-0 w-64 border-r border-[#e5e7eb] last:border-r-0">
                  <div className="h-12 flex items-center justify-between px-3 border-b border-[#e5e7eb] bg-[#fafafa]">
                    <span className="text-sm font-semibold text-[#1a1a1a]">#{index + 1}</span>
                    <button
                      onClick={() => handleDeleteColumn(index)}
                      className="p-1 rounded text-[#d1d5db] hover:text-[#ef4444] hover:bg-[#fef2f2] transition-colors"
                      disabled={plan.storyboard.length <= 1}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* rowOrder 순서에 따라 동적 렌더링 */}
                  {rowOrder.map((rowKey) => {
                    const height = rowHeights[rowKey];
                    const isNarration = rowKey === 'narration';
                    
                    // 영상 섹션
                    if (rowKey === 'image') {
                      return (
                        <div 
                          key={rowKey}
                          className="border-b border-[#e5e7eb] relative group"
                          style={{ height }}
                        >
                          {item.image ? (
                            <div className="relative w-full h-full">
                              <img
                                src={item.image}
                                alt={`Scene ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
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
                      );
                    }
                    
                    // 텍스트 입력 섹션들
                    const placeholders: Record<RowType, string> = {
                      image: '',
                      timeline: '타임라인...',
                      source: '소스...',
                      effect: '효과...',
                      note: '특이사항...',
                      narration: '대본/나레이션...',
                    };
                    
                    const getValue = () => {
                      switch (rowKey) {
                        case 'timeline': return item.timeline || '';
                        case 'source': return item.source || '';
                        case 'effect': return item.effect || '';
                        case 'note': return item.note || '';
                        case 'narration': return item.narration || '';
                        default: return '';
                      }
                    };
                    
                    return (
                      <div 
                        key={rowKey}
                        className={`border-b border-[#e5e7eb] ${isNarration ? 'bg-[#f5efe6]' : ''}`}
                        style={{ height }}
                      >
                        <textarea
                          value={getValue()}
                          onChange={(e) => handleUpdateColumn(index, rowKey, e.target.value)}
                          placeholder={placeholders[rowKey]}
                          className="w-full h-full p-3 bg-transparent resize-none outline-none text-sm text-[#1a1a1a] placeholder:text-[#d1d5db]"
                        />
                      </div>
                    );
                  })}

                  {/* 소스 파일 섹션 */}
                  <div className="h-[100px] p-2 bg-[#fafafa] border-b border-[#e5e7eb]">
                    <div className="space-y-1">
                      {[0, 1, 2].map((fileIndex) => {
                        const sourceFile = item.sourceFiles?.[fileIndex];
                        return (
                          <div key={fileIndex} className="flex items-center gap-1">
                            <span className="text-xs text-[#9ca3af] w-10">소스{fileIndex + 1}</span>
                            {sourceFile ? (
                              <div className="flex-1 flex items-center gap-1 px-2 py-1 bg-white rounded border border-[#e5e7eb] min-w-0">
                                <span className="text-xs text-[#1a1a1a] truncate flex-1">{sourceFile.name}</span>
                                <button
                                  onClick={() => handleSourceFileDownload(sourceFile)}
                                  className="p-0.5 text-[#f97316] hover:text-[#ea580c]"
                                  title="다운로드"
                                >
                                  <Download size={12} />
                                </button>
                                <button
                                  onClick={() => handleSourceFileDelete(index, fileIndex)}
                                  className="p-0.5 text-[#ef4444] hover:text-[#dc2626]"
                                  title="삭제"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleSourceFileUpload(index, fileIndex)}
                                className="flex-1 flex items-center justify-center gap-1 px-2 py-1 border border-dashed border-[#d1d5db] rounded text-xs text-[#9ca3af] hover:text-[#f97316] hover:border-[#f97316] transition-colors"
                              >
                                <Upload size={10} />
                                업로드
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}

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

export default function PlanDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
      <PlanDetailContent />
    </Suspense>
  );
}
