'use client';

import { PlanSection, SECTION_TYPES } from '@/types/plan';
import { Trash2, GripVertical, Film, FileText, AlertCircle, Folder, Sparkles } from 'lucide-react';

interface SectionEditorProps {
  section: PlanSection;
  onChange: (section: PlanSection) => void;
  onDelete: () => void;
}

export default function SectionEditor({
  section,
  onChange,
  onDelete,
}: SectionEditorProps) {
  const handleChange = (field: keyof PlanSection, value: string) => {
    onChange({ ...section, [field]: value });
  };

  // 섹션 타입에 따른 스타일 클래스
  const getSectionClass = (type: string) => {
    if (type.includes('CTA')) return 'section-cta';
    if (type.includes('본문')) return 'section-content';
    return 'section-default';
  };

  // 섹션 타입에 따른 아이콘 색상
  const getAccentColor = (type: string) => {
    if (type.includes('CTA')) return 'text-amber-400';
    if (type.includes('본문')) return 'text-blue-400';
    return 'text-indigo-400';
  };

  return (
    <div className={`section-card ${getSectionClass(section.sectionType)}`}>
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/5 cursor-grab hover:bg-white/10 transition-colors">
            <GripVertical size={18} className="text-[#5c5c6f]" />
          </div>
          <div className="relative">
            <select
              value={section.sectionType}
              onChange={(e) => handleChange('sectionType', e.target.value)}
              className={`appearance-none bg-transparent font-semibold text-base border-none outline-none cursor-pointer pr-6 ${getAccentColor(section.sectionType)}`}
            >
              {SECTION_TYPES.map((type) => (
                <option key={type} value={type} className="bg-[#16161f] text-white">
                  {type}
                </option>
              ))}
            </select>
            <div className={`absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none ${getAccentColor(section.sectionType)}`}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              </svg>
            </div>
          </div>
        </div>
        <button
          onClick={onDelete}
          className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-[#5c5c6f] hover:text-red-400 transition-all duration-200"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* 섹션 내용 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 영상 설명 */}
        <div className="space-y-2">
          <label className="field-label">
            <Film size={14} className="text-indigo-400" />
            영상
          </label>
          <textarea
            value={section.videoDescription}
            onChange={(e) => handleChange('videoDescription', e.target.value)}
            placeholder="영상 내용을 입력하세요..."
            className="input-field focus-ring w-full min-h-[100px] resize-none text-sm leading-relaxed"
          />
        </div>

        {/* 대본 */}
        <div className="space-y-2">
          <label className="field-label">
            <FileText size={14} className="text-purple-400" />
            대본 (나레이션)
          </label>
          <textarea
            value={section.script}
            onChange={(e) => handleChange('script', e.target.value)}
            placeholder="대본을 입력하세요..."
            className="input-field focus-ring w-full min-h-[100px] resize-none text-sm leading-relaxed"
          />
        </div>

        {/* 특이사항 */}
        <div className="space-y-2">
          <label className="field-label">
            <AlertCircle size={14} className="text-amber-400" />
            특이사항
          </label>
          <textarea
            value={section.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="특이사항을 입력하세요..."
            className="input-field focus-ring w-full min-h-[80px] resize-none text-sm leading-relaxed"
          />
        </div>

        {/* 소스 */}
        <div className="space-y-2">
          <label className="field-label">
            <Folder size={14} className="text-emerald-400" />
            소스
          </label>
          <input
            type="text"
            value={section.sourceInfo}
            onChange={(e) => handleChange('sourceInfo', e.target.value)}
            placeholder="자막과 어울리는 소스 사용"
            className="input-field focus-ring w-full text-sm"
          />
        </div>

        {/* 효과 */}
        <div className="md:col-span-2 space-y-2">
          <label className="field-label">
            <Sparkles size={14} className="text-pink-400" />
            효과
          </label>
          <input
            type="text"
            value={section.effectInfo}
            onChange={(e) => handleChange('effectInfo', e.target.value)}
            placeholder="폭죽 이펙트 추가할 수 있으면 추가"
            className="input-field focus-ring w-full text-sm"
          />
        </div>
      </div>
    </div>
  );
}
