'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlanSection } from '@/types/plan';
import { createPlan, createEmptySection, getPlans, getBrands } from '@/lib/store';
import Sidebar from '@/components/Sidebar';
import SectionEditor from '@/components/SectionEditor';
import { ArrowLeft, Save, Plus, Tag, X, FileText, DollarSign, Link2, Clock, StickyNote, Layers, FolderKanban } from 'lucide-react';
import Link from 'next/link';
import { Plan, Brand } from '@/types/plan';

export default function NewPlanPage() {
  const router = useRouter();
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [saving, setSaving] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');

  // 폼 상태
  const [formData, setFormData] = useState({
    title: '',
    brandId: '' as string | undefined,
    videoNumber: 1,
    sourceCost: 0,
    productionCost: 0,
    rfLink: '',
    videoLength: '',
    referenceNote: '',
    keywords: [] as string[],
    sections: [createEmptySection('상단CTA')] as PlanSection[],
  });

  useEffect(() => {
    const loadData = async () => {
      const [plans, brandsData] = await Promise.all([
        getPlans(),
        getBrands(),
      ]);
      setAllPlans(plans);
      setBrands(brandsData);
      // 자동으로 다음 영상 번호 설정
      if (plans.length > 0) {
        const maxVideoNumber = Math.max(...plans.map((p) => p.videoNumber));
        setFormData((prev) => ({ ...prev, videoNumber: maxVideoNumber + 1 }));
      }
    };
    loadData();
  }, []);

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('기획안 제목을 입력해주세요.');
      return;
    }

    setSaving(true);
    await createPlan({
      ...formData,
      brandId: formData.brandId || undefined,
    });
    setSaving(false);
    router.push('/');
  };

  const handleFieldChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSectionChange = (index: number, section: PlanSection) => {
    const newSections = [...formData.sections];
    newSections[index] = section;
    setFormData((prev) => ({ ...prev, sections: newSections }));
  };

  const handleAddSection = () => {
    const newSection = createEmptySection();
    setFormData((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
  };

  const handleDeleteSection = (index: number) => {
    const newSections = formData.sections.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, sections: newSections }));
  };

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    if (!formData.keywords.includes(newKeyword.trim())) {
      setFormData((prev) => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()],
      }));
    }
    setNewKeyword('');
  };

  const handleRemoveKeyword = (keyword: string) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((k) => k !== keyword),
    }));
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar plans={allPlans} />

      <main className="flex-1 ml-60 p-8 lg:p-10">
        {/* 상단 네비게이션 */}
        <div className="flex items-center justify-between mb-8 animate-fade-in-up">
          <Link href="/">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-[#6b7280] hover:text-[#f97316] hover:bg-[#fff7ed] transition-all">
              <ArrowLeft size={18} />
              <span className="font-medium">목록으로</span>
            </button>
          </Link>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </div>

        {/* 기획안 헤더 */}
        <div className="mb-8 animate-fade-in-up stagger-1">
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            className="text-3xl font-bold bg-transparent border-none outline-none w-full mb-4 text-[#1a1a1a] placeholder:text-[#d1d5db]"
            placeholder="✨ 기획안 제목을 입력하세요"
            autoFocus
          />
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#fff7ed] border border-[#fed7aa]">
              <FileText size={16} className="text-[#f97316]" />
              <span className="text-sm text-[#c2410c]">영상</span>
              <input
                type="number"
                value={formData.videoNumber}
                onChange={(e) =>
                  handleFieldChange('videoNumber', parseInt(e.target.value) || 1)
                }
                className="w-14 bg-transparent text-[#c2410c] font-semibold text-center border-b border-[#f97316]/30 focus:border-[#f97316]"
              />
              <span className="text-sm text-[#c2410c]">번</span>
            </div>

            {/* 프로젝트 선택 */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#f0e6dc]">
              <FolderKanban size={16} className="text-[#f97316]" />
              <select
                value={formData.brandId || ''}
                onChange={(e) => handleFieldChange('brandId', e.target.value || undefined)}
                className="bg-transparent text-sm text-[#4b5563] cursor-pointer"
              >
                <option value="">프로젝트 선택</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 기본 정보 */}
        <div className="glass-card mb-8 animate-fade-in-up stagger-2">
          <h2 className="flex items-center gap-3 text-xl font-semibold text-[#1a1a1a] mb-6">
            <div className="p-2 rounded-lg bg-[#fff7ed]">
              <Layers size={20} className="text-[#f97316]" />
            </div>
            기본 정보
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 소스 비용 */}
            <div className="space-y-2">
              <label className="field-label">
                <DollarSign size={14} className="text-[#22c55e]" />
                소스 비용
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  value={formData.sourceCost}
                  onChange={(e) =>
                    handleFieldChange('sourceCost', parseInt(e.target.value) || 0)
                  }
                  className="input-field flex-1 rounded-r-none border-r-0"
                />
                <span className="px-4 py-3 bg-[#dcfce7] border border-[#bbf7d0] rounded-r-lg text-[#15803d] font-medium text-sm">
                  원
                </span>
              </div>
            </div>

            {/* 제작 비용 */}
            <div className="space-y-2">
              <label className="field-label">
                <DollarSign size={14} className="text-[#f97316]" />
                제작 비용
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  value={formData.productionCost}
                  onChange={(e) =>
                    handleFieldChange(
                      'productionCost',
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="input-field flex-1 rounded-r-none border-r-0"
                />
                <span className="px-4 py-3 bg-[#fff7ed] border border-[#fed7aa] rounded-r-lg text-[#c2410c] font-medium text-sm">
                  원
                </span>
              </div>
            </div>

            {/* 영상 길이 */}
            <div className="space-y-2">
              <label className="field-label">
                <Clock size={14} className="text-[#f59e0b]" />
                영상 길이
              </label>
              <input
                type="text"
                value={formData.videoLength}
                onChange={(e) => handleFieldChange('videoLength', e.target.value)}
                placeholder="예: 1080 * 1920 (9:16)"
                className="input-field"
              />
            </div>

            {/* RF 링크 */}
            <div className="md:col-span-2 lg:col-span-3 space-y-2">
              <label className="field-label">
                <Link2 size={14} className="text-[#8b5cf6]" />
                RF 링크
              </label>
              <input
                type="url"
                value={formData.rfLink}
                onChange={(e) => handleFieldChange('rfLink', e.target.value)}
                placeholder="https://..."
                className="input-field"
              />
            </div>

            {/* 참고 정보 */}
            <div className="md:col-span-2 lg:col-span-3 space-y-2">
              <label className="field-label">
                <StickyNote size={14} className="text-[#ec4899]" />
                참고 정보
              </label>
              <textarea
                value={formData.referenceNote}
                onChange={(e) =>
                  handleFieldChange('referenceNote', e.target.value)
                }
                placeholder="참고 정보를 입력하세요..."
                className="input-field resize-none min-h-[100px] leading-relaxed"
              />
            </div>

            {/* 키워드 */}
            <div className="md:col-span-2 lg:col-span-3 space-y-3">
              <label className="field-label">
                <Tag size={14} className="text-[#f97316]" />
                들어가야 하는 키워드
              </label>
              
              {formData.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.keywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="keyword-tag group"
                    >
                      {keyword}
                      <button
                        onClick={() => handleRemoveKeyword(keyword)}
                        className="opacity-60 hover:opacity-100 hover:text-[#ef4444] transition-all"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                  placeholder="키워드를 입력하고 Enter..."
                  className="input-field flex-1"
                />
                <button
                  onClick={handleAddKeyword}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Plus size={18} />
                  추가
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 섹션들 */}
        <div className="mb-8 animate-fade-in-up stagger-3">
          <div className="flex items-center justify-between mb-6">
            <h2 className="flex items-center gap-3 text-xl font-semibold text-[#1a1a1a]">
              <div className="p-2 rounded-lg bg-[#faf5ff]">
                <FileText size={20} className="text-[#8b5cf6]" />
              </div>
              섹션
              <span className="ml-2 px-3 py-1 rounded-full bg-[#fff7ed] text-sm text-[#c2410c]">
                {formData.sections.length}
              </span>
            </h2>
            <button
              onClick={handleAddSection}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus size={18} />
              섹션 추가
            </button>
          </div>

          <div className="space-y-5">
            {formData.sections.map((section, index) => (
              <div key={section.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <SectionEditor
                  section={section}
                  onChange={(s) => handleSectionChange(index, s)}
                  onDelete={() => handleDeleteSection(index)}
                />
              </div>
            ))}
          </div>

          {formData.sections.length === 0 && (
            <div className="text-center py-16 border-2 border-dashed border-[#f0e6dc] rounded-2xl bg-white">
              <div className="inline-flex p-4 rounded-2xl bg-[#fff7ed] mb-4">
                <Layers size={32} className="text-[#f97316]" />
              </div>
              <p className="text-[#9ca3af] mb-4">아직 섹션이 없습니다</p>
              <button
                onClick={handleAddSection}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus size={18} />
                첫 섹션 추가하기
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
