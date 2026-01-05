'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlanSection } from '@/types/plan';
import { createPlan, createEmptySection, getPlans } from '@/lib/store';
import Sidebar from '@/components/Sidebar';
import SectionEditor from '@/components/SectionEditor';
import { ArrowLeft, Save, Plus, Tag, X } from 'lucide-react';
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

      <main className="flex-1 ml-64 p-8">
        {/* 상단 네비게이션 */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/">
            <button className="flex items-center gap-2 text-[#9b9a97] hover:text-white transition-colors">
              <ArrowLeft size={18} />
              목록으로
            </button>
          </Link>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>

        {/* 기획안 헤더 */}
        <div className="mb-8">
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            className="text-3xl font-bold bg-transparent border-none outline-none w-full mb-2 placeholder:text-[#6b6b6b]"
            placeholder="기획안 제목을 입력하세요"
            autoFocus
          />
          <div className="flex items-center gap-4 text-sm text-[#9b9a97]">
            <span>
              영상{' '}
              <input
                type="number"
                value={formData.videoNumber}
                onChange={(e) =>
                  handleFieldChange('videoNumber', parseInt(e.target.value) || 1)
                }
                className="w-12 bg-transparent border-b border-[#333] text-white text-center"
              />
              번
            </span>
          </div>
        </div>

        {/* 기본 정보 */}
        <div className="bg-[#252525] rounded-lg p-6 mb-6 border border-[#333]">
          <h2 className="text-lg font-medium mb-4">기본 정보</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 소스 비용 */}
            <div>
              <label className="block text-xs text-[#9b9a97] mb-1">
                소스 비용
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  value={formData.sourceCost}
                  onChange={(e) =>
                    handleFieldChange('sourceCost', parseInt(e.target.value) || 0)
                  }
                  className="flex-1 bg-[#1a1a1a] text-white p-2 rounded-l border border-[#333] focus:border-[#555]"
                />
                <span className="bg-[#333] px-3 py-2 rounded-r border border-l-0 border-[#333] text-[#9b9a97]">
                  원
                </span>
              </div>
            </div>

            {/* 제작 비용 */}
            <div>
              <label className="block text-xs text-[#9b9a97] mb-1">
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
                  className="flex-1 bg-[#1a1a1a] text-white p-2 rounded-l border border-[#333] focus:border-[#555]"
                />
                <span className="bg-[#333] px-3 py-2 rounded-r border border-l-0 border-[#333] text-[#9b9a97]">
                  원
                </span>
              </div>
            </div>

            {/* 영상 길이 */}
            <div>
              <label className="block text-xs text-[#9b9a97] mb-1">
                영상 길이
              </label>
              <input
                type="text"
                value={formData.videoLength}
                onChange={(e) => handleFieldChange('videoLength', e.target.value)}
                placeholder="예: 1080 * 1920 (9:16)"
                className="w-full bg-[#1a1a1a] text-white p-2 rounded border border-[#333] focus:border-[#555]"
              />
            </div>

            {/* RF 링크 */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-xs text-[#9b9a97] mb-1">
                RF 링크
              </label>
              <input
                type="url"
                value={formData.rfLink}
                onChange={(e) => handleFieldChange('rfLink', e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#1a1a1a] text-white p-2 rounded border border-[#333] focus:border-[#555]"
              />
            </div>

            {/* 참고 정보 */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-xs text-[#9b9a97] mb-1">
                참고 정보
              </label>
              <textarea
                value={formData.referenceNote}
                onChange={(e) =>
                  handleFieldChange('referenceNote', e.target.value)
                }
                placeholder="참고 정보를 입력하세요..."
                className="w-full bg-[#1a1a1a] text-white p-2 rounded border border-[#333] focus:border-[#555] resize-none min-h-[80px]"
              />
            </div>

            {/* 키워드 */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-xs text-[#9b9a97] mb-1">
                <Tag size={12} className="inline mr-1" />
                들어가야 하는 키워드
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.keywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1 px-2 py-1 bg-[#1a1a1a] rounded text-sm"
                  >
                    {keyword}
                    <button
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="text-[#6b6b6b] hover:text-red-400"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                  placeholder="키워드 추가..."
                  className="flex-1 bg-[#1a1a1a] text-white p-2 rounded border border-[#333] focus:border-[#555]"
                />
                <button
                  onClick={handleAddKeyword}
                  className="px-3 py-2 bg-[#333] rounded hover:bg-[#444] transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 섹션들 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">섹션</h2>
            <button
              onClick={handleAddSection}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#333] rounded hover:bg-[#444] transition-colors text-sm"
            >
              <Plus size={16} />
              섹션 추가
            </button>
          </div>

          <div className="space-y-4">
            {formData.sections.map((section, index) => (
              <SectionEditor
                key={section.id}
                section={section}
                onChange={(s) => handleSectionChange(index, s)}
                onDelete={() => handleDeleteSection(index)}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

