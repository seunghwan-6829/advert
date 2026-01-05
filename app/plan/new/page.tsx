'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlanSection } from '@/types/plan';
import { createPlan, createEmptySection, getPlans } from '@/lib/store';
import Sidebar from '@/components/Sidebar';
import SectionEditor from '@/components/SectionEditor';
import { ArrowLeft, Save, Plus, Tag, X, FileText, DollarSign, Link2, Clock, StickyNote, Layers } from 'lucide-react';
import Link from 'next/link';
import { Plan } from '@/types/plan';

export default function NewPlanPage() {
  const router = useRouter();
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [saving, setSaving] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');

  // 폼 상태
  const [formData, setFormData] = useState({
    title: '',
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
    const loadPlans = async () => {
      const plans = await getPlans();
      setAllPlans(plans);
      // 자동으로 다음 영상 번호 설정
      if (plans.length > 0) {
        const maxVideoNumber = Math.max(...plans.map((p) => p.videoNumber));
        setFormData((prev) => ({ ...prev, videoNumber: maxVideoNumber + 1 }));
      }
    };
    loadPlans();
  }, []);

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('기획안 제목을 입력해주세요.');
      return;
    }

    setSaving(true);
    const newPlan = await createPlan(formData);
    setSaving(false);
    router.push(`/plan/${newPlan.id}`);
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

      <main className="flex-1 ml-64 p-8 lg:p-12">
        {/* 상단 네비게이션 */}
        <div className="flex items-center justify-between mb-8 animate-fade-in-up">
          <Link href="/">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-[#8b8b9e] hover:text-white hover:bg-white/5 transition-all duration-200">
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
        <div className="mb-10 animate-fade-in-up stagger-1">
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            className="page-title bg-transparent border-none outline-none w-full mb-4 placeholder:text-[#3a3a4a]"
            placeholder="✨ 기획안 제목을 입력하세요"
            autoFocus
          />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <FileText size={16} className="text-indigo-400" />
              <span className="text-sm text-[#8b8b9e]">영상</span>
              <input
                type="number"
                value={formData.videoNumber}
                onChange={(e) =>
                  handleFieldChange('videoNumber', parseInt(e.target.value) || 1)
                }
                className="w-14 bg-transparent text-indigo-400 font-semibold text-center border-b border-indigo-500/30 focus:border-indigo-400"
              />
              <span className="text-sm text-[#8b8b9e]">번</span>
            </div>
          </div>
        </div>

        {/* 기본 정보 */}
        <div className="glass-card rounded-2xl p-8 mb-8 animate-fade-in-up stagger-2">
          <h2 className="flex items-center gap-3 text-xl font-semibold mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
              <Layers size={20} className="text-indigo-400" />
            </div>
            기본 정보
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 소스 비용 */}
            <div className="space-y-2">
              <label className="field-label">
                <DollarSign size={14} className="text-emerald-400" />
                소스 비용
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  value={formData.sourceCost}
                  onChange={(e) =>
                    handleFieldChange('sourceCost', parseInt(e.target.value) || 0)
                  }
                  className="input-field focus-ring flex-1 rounded-r-none border-r-0"
                />
                <span className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-r-lg text-emerald-400 font-medium text-sm">
                  원
                </span>
              </div>
            </div>

            {/* 제작 비용 */}
            <div className="space-y-2">
              <label className="field-label">
                <DollarSign size={14} className="text-blue-400" />
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
                  className="input-field focus-ring flex-1 rounded-r-none border-r-0"
                />
                <span className="px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-r-lg text-blue-400 font-medium text-sm">
                  원
                </span>
              </div>
            </div>

            {/* 영상 길이 */}
            <div className="space-y-2">
              <label className="field-label">
                <Clock size={14} className="text-amber-400" />
                영상 길이
              </label>
              <input
                type="text"
                value={formData.videoLength}
                onChange={(e) => handleFieldChange('videoLength', e.target.value)}
                placeholder="예: 1080 * 1920 (9:16)"
                className="input-field focus-ring w-full"
              />
            </div>

            {/* RF 링크 */}
            <div className="md:col-span-2 lg:col-span-3 space-y-2">
              <label className="field-label">
                <Link2 size={14} className="text-purple-400" />
                RF 링크
              </label>
              <input
                type="url"
                value={formData.rfLink}
                onChange={(e) => handleFieldChange('rfLink', e.target.value)}
                placeholder="https://..."
                className="input-field focus-ring w-full"
              />
            </div>

            {/* 참고 정보 */}
            <div className="md:col-span-2 lg:col-span-3 space-y-2">
              <label className="field-label">
                <StickyNote size={14} className="text-pink-400" />
                참고 정보
              </label>
              <textarea
                value={formData.referenceNote}
                onChange={(e) =>
                  handleFieldChange('referenceNote', e.target.value)
                }
                placeholder="참고 정보를 입력하세요..."
                className="input-field focus-ring w-full resize-none min-h-[100px] leading-relaxed"
              />
            </div>

            {/* 키워드 */}
            <div className="md:col-span-2 lg:col-span-3 space-y-3">
              <label className="field-label">
                <Tag size={14} className="text-indigo-400" />
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
                        className="opacity-60 hover:opacity-100 hover:text-red-400 transition-all"
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
                  className="input-field focus-ring flex-1"
                />
                <button
                  onClick={handleAddKeyword}
                  className="btn-secondary flex items-center gap-2 px-5"
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
            <h2 className="flex items-center gap-3 text-xl font-semibold">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <FileText size={20} className="text-purple-400" />
              </div>
              섹션
              <span className="ml-2 px-2.5 py-0.5 rounded-full bg-white/5 text-sm text-[#8b8b9e]">
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
            <div className="text-center py-16 border-2 border-dashed border-[#2a2a3a] rounded-2xl">
              <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 mb-4">
                <Layers size={32} className="text-[#5c5c6f]" />
              </div>
              <p className="text-[#5c5c6f] mb-4">아직 섹션이 없습니다</p>
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
