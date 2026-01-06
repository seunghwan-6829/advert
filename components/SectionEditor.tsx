'use client';

import { PlanSection, SECTION_TYPES } from '@/types/plan';
import { Trash2, GripVertical, Film, FileText, AlertCircle, Folder, Sparkles, ChevronDown } from 'lucide-react';

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

  // 섹션 타입에 따른 태그 색상
  const getTagClass = (type: string) => {
    if (type.includes('CTA')) return 'tag-orange';
    if (type.includes('본문')) return 'tag-blue';
    return 'tag-purple';
  };

  return (
    <div className={`section-card ${getSectionClass(section.sectionType)}`}>
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#fff7ed] cursor-grab hover:bg-[#ffedd5] transition-colors">
            <GripVertical size={18} className="text-[#f97316]" />
          </div>
          <div className="relative">
            <select
              value={section.sectionType}
              onChange={(e) => handleChange('sectionType', e.target.value)}
              className={`tag ${getTagClass(section.sectionType)} appearance-none cursor-pointer pr-7 font-medium`}
            >
              {SECTION_TYPES.map((type) => (
                <option key={type} value={type} className="bg-white text-[#1a1a1a]">
                  {type}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
          </div>
        </div>
        <button
          onClick={onDelete}
          className="p-2 rounded-lg hover:bg-[#fef2f2] text-[#9ca3af] hover:text-[#ef4444] transition-all"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* 섹션 내용 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 영상 설명 */}
        <div className="space-y-2">
          <label className="field-label">
            <Film size={14} className="text-[#f97316]" />
            영상
          </label>
          <textarea
            value={section.videoDescription}
            onChange={(e) => handleChange('videoDescription', e.target.value)}
            placeholder="영상 내용을 입력하세요..."
            className="input-field min-h-[100px] resize-none text-sm leading-relaxed"
          />
        </div>

        {/* 대본 */}
        <div className="space-y-2">
          <label className="field-label">
            <FileText size={14} className="text-[#8b5cf6]" />
            대본 (나레이션)
          </label>
          <textarea
            value={section.script}
            onChange={(e) => handleChange('script', e.target.value)}
            placeholder="대본을 입력하세요..."
            className="input-field min-h-[100px] resize-none text-sm leading-relaxed"
          />
        </div>

        {/* 특이사항 */}
        <div className="space-y-2">
          <label className="field-label">
            <AlertCircle size={14} className="text-[#f59e0b]" />
            특이사항
          </label>
          <textarea
            value={section.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="특이사항을 입력하세요..."
            className="input-field min-h-[80px] resize-none text-sm leading-relaxed"
          />
        </div>

        {/* 소스 */}
        <div className="space-y-2">
          <label className="field-label">
            <Folder size={14} className="text-[#22c55e]" />
            소스
          </label>
          <input
            type="text"
            value={section.sourceInfo}
            onChange={(e) => handleChange('sourceInfo', e.target.value)}
            placeholder="자막과 어울리는 소스 사용"
            className="input-field text-sm"
          />
        </div>

        {/* 효과 */}
        <div className="md:col-span-2 space-y-2">
          <label className="field-label">
            <Sparkles size={14} className="text-[#ec4899]" />
            효과
          </label>
          <input
            type="text"
            value={section.effectInfo}
            onChange={(e) => handleChange('effectInfo', e.target.value)}
            placeholder="폭죽 이펙트 추가할 수 있으면 추가"
            className="input-field text-sm"
          />
        </div>
      </div>
    </div>
  );
}
