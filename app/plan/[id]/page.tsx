'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plan, PlanSection } from '@/types/plan';
import { getPlanById, updatePlan, deletePlan, createEmptySection, getPlans } from '@/lib/store';
import Sidebar from '@/components/Sidebar';
import SectionEditor from '@/components/SectionEditor';
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  ExternalLink,
  Tag,
  X,
} from 'lucide-react';
import Link from 'next/link';

export default function PlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.id as string;

  const [plan, setPlan] = useState<Plan | null>(null);
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const [planData, plansData] = await Promise.all([
        getPlanById(planId),
        getPlans(),
      ]);
      setPlan(planData);
      setAllPlans(plansData);
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
      router.push('/');
    }
  };

  const handleFieldChange = (field: keyof Plan, value: unknown) => {
    if (!plan) return;
    setPlan({ ...plan, [field]: value });
  };

  const handleSectionChange = (index: number, section: PlanSection) => {
    if (!plan) return;
    const newSections = [...plan.sections];
    newSections[index] = section;
    setPlan({ ...plan, sections: newSections });
  };

  const handleAddSection = () => {
    if (!plan) return;
    const newSection = createEmptySection();
    setPlan({ ...plan, sections: [...plan.sections, newSection] });
  };

  const handleDeleteSection = (index: number) => {
    if (!plan) return;
    const newSections = plan.sections.filter((_, i) => i !== index);
    setPlan({ ...plan, sections: newSections });
  };

  const handleAddKeyword = () => {
    if (!plan || !newKeyword.trim()) return;
    if (!plan.keywords.includes(newKeyword.trim())) {
      setPlan({ ...plan, keywords: [...plan.keywords, newKeyword.trim()] });
    }
    setNewKeyword('');
  };

  const handleRemoveKeyword = (keyword: string) => {
    if (!plan) return;
    setPlan({ ...plan, keywords: plan.keywords.filter((k) => k !== keyword) });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar plans={allPlans} currentPlanId={planId} />
        <main className="flex-1 ml-64 p-8 flex items-center justify-center">
          <div className="text-[#9b9a97]">불러오는 중...</div>
        </main>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex min-h-screen">
        <Sidebar plans={allPlans} />
        <main className="flex-1 ml-64 p-8 flex flex-col items-center justify-center">
          <h2 className="text-xl font-medium mb-4">기획안을 찾을 수 없습니다</h2>
          <Link href="/">
            <button className="text-[#9b9a97] hover:text-white">
              목록으로 돌아가기
            </button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar plans={allPlans} currentPlanId={planId} />

      <main className="flex-1 ml-64 p-8">
        {/* 상단 네비게이션 */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/">
            <button className="flex items-center gap-2 text-[#9b9a97] hover:text-white transition-colors">
              <ArrowLeft size={18} />
              목록으로
            </button>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
            >
              <Trash2 size={18} />
              삭제
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>

        {/* 기획안 헤더 */}
        <div className="mb-8">
          <input
            type="text"
            value={plan.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            className="text-3xl font-bold bg-transparent border-none outline-none w-full mb-2"
            placeholder="기획안 제목"
          />
          <div className="flex items-center gap-4 text-sm text-[#9b9a97]">
            <span>
              영상{' '}
              <input
                type="number"
                value={plan.videoNumber}
                onChange={(e) =>
                  handleFieldChange('videoNumber', parseInt(e.target.value) || 1)
                }
                className="w-12 bg-transparent border-b border-[#333] text-white text-center"
              />
              번
            </span>
            <span>•</span>
            <span>
              생성일: {new Date(plan.createdAt).toLocaleDateString('ko-KR')}
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
                  value={plan.sourceCost}
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
                  value={plan.productionCost}
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
                value={plan.videoLength}
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
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={plan.rfLink}
                  onChange={(e) => handleFieldChange('rfLink', e.target.value)}
                  placeholder="https://..."
                  className="flex-1 bg-[#1a1a1a] text-white p-2 rounded border border-[#333] focus:border-[#555]"
                />
                {plan.rfLink && (
                  <a
                    href={plan.rfLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-[#333] rounded hover:bg-[#444] transition-colors"
                  >
                    <ExternalLink size={18} />
                  </a>
                )}
              </div>
            </div>

            {/* 참고 정보 */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-xs text-[#9b9a97] mb-1">
                참고 정보
              </label>
              <textarea
                value={plan.referenceNote}
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
                {plan.keywords.map((keyword, idx) => (
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
            {plan.sections.length === 0 ? (
              <div className="text-center py-8 text-[#6b6b6b]">
                <p className="mb-2">아직 섹션이 없습니다</p>
                <button
                  onClick={handleAddSection}
                  className="text-[#9b9a97] hover:text-white underline"
                >
                  첫 번째 섹션 추가하기
                </button>
              </div>
            ) : (
              plan.sections.map((section, index) => (
                <SectionEditor
                  key={section.id}
                  section={section}
                  onChange={(s) => handleSectionChange(index, s)}
                  onDelete={() => handleDeleteSection(index)}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

