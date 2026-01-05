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
  FileText,
  DollarSign,
  Link2,
  Clock,
  StickyNote,
  Layers,
  Calendar,
  Loader2,
  AlertTriangle,
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
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 animate-pulse">
              <Loader2 size={32} className="text-indigo-400 animate-spin" />
            </div>
            <span className="text-[#8b8b9e]">불러오는 중...</span>
          </div>
        </main>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex min-h-screen">
        <Sidebar plans={allPlans} />
        <main className="flex-1 ml-64 p-8 flex flex-col items-center justify-center">
          <div className="glass-card rounded-2xl p-12 text-center max-w-md">
            <div className="inline-flex p-4 rounded-2xl bg-red-500/10 mb-6">
              <AlertTriangle size={40} className="text-red-400" />
            </div>
            <h2 className="text-xl font-semibold mb-3">기획안을 찾을 수 없습니다</h2>
            <p className="text-[#8b8b9e] mb-6">요청하신 기획안이 존재하지 않거나 삭제되었습니다.</p>
            <Link href="/">
              <button className="btn-primary">
                목록으로 돌아가기
              </button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar plans={allPlans} currentPlanId={planId} />

      <main className="flex-1 ml-64 p-8 lg:p-12">
        {/* 상단 네비게이션 */}
        <div className="flex items-center justify-between mb-8 animate-fade-in-up">
          <Link href="/">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-[#8b8b9e] hover:text-white hover:bg-white/5 transition-all duration-200">
              <ArrowLeft size={18} />
              <span className="font-medium">목록으로</span>
            </button>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200"
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

        {/* 기획안 헤더 */}
        <div className="mb-10 animate-fade-in-up stagger-1">
          <input
            type="text"
            value={plan.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            className="page-title bg-transparent border-none outline-none w-full mb-4"
            placeholder="기획안 제목"
          />
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <FileText size={16} className="text-indigo-400" />
              <span className="text-sm text-[#8b8b9e]">영상</span>
              <input
                type="number"
                value={plan.videoNumber}
                onChange={(e) =>
                  handleFieldChange('videoNumber', parseInt(e.target.value) || 1)
                }
                className="w-14 bg-transparent text-indigo-400 font-semibold text-center border-b border-indigo-500/30 focus:border-indigo-400"
              />
              <span className="text-sm text-[#8b8b9e]">번</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <Calendar size={16} className="text-purple-400" />
              <span className="text-sm text-[#8b8b9e]">
                생성일: {new Date(plan.createdAt).toLocaleDateString('ko-KR')}
              </span>
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
                  value={plan.sourceCost}
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
                  value={plan.productionCost}
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
                value={plan.videoLength}
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
              <div className="flex items-center gap-3">
                <input
                  type="url"
                  value={plan.rfLink}
                  onChange={(e) => handleFieldChange('rfLink', e.target.value)}
                  placeholder="https://..."
                  className="input-field focus-ring flex-1"
                />
                {plan.rfLink && (
                  <a
                    href={plan.rfLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary p-3 flex items-center justify-center"
                  >
                    <ExternalLink size={18} />
                  </a>
                )}
              </div>
            </div>

            {/* 참고 정보 */}
            <div className="md:col-span-2 lg:col-span-3 space-y-2">
              <label className="field-label">
                <StickyNote size={14} className="text-pink-400" />
                참고 정보
              </label>
              <textarea
                value={plan.referenceNote}
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
              
              {plan.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {plan.keywords.map((keyword, idx) => (
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
                {plan.sections.length}
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
            {plan.sections.length === 0 ? (
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
            ) : (
              plan.sections.map((section, index) => (
                <div key={section.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <SectionEditor
                    section={section}
                    onChange={(s) => handleSectionChange(index, s)}
                    onDelete={() => handleDeleteSection(index)}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
