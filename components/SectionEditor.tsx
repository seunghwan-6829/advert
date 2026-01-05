'use client';

import { PlanSection, SECTION_TYPES } from '@/types/plan';
import { Trash2, GripVertical } from 'lucide-react';

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

  // 섹션 타입에 따른 색상
  const getTypeColor = (type: string) => {
    if (type.includes('CTA')) return 'bg-[#4a3728] border-[#b45309]';
    if (type.includes('본문')) return 'bg-[#2d3748] border-[#4299e1]';
    return 'bg-[#2f2f2f] border-[#444]';
  };

  return (
    <div
      className={`rounded-lg border p-4 ${getTypeColor(section.sectionType)}`}
    >
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GripVertical size={16} className="text-[#6b6b6b] cursor-grab" />
          <select
            value={section.sectionType}
            onChange={(e) => handleChange('sectionType', e.target.value)}
            className="bg-transparent text-white font-medium text-sm border-none outline-none cursor-pointer"
          >
            {SECTION_TYPES.map((type) => (
              <option key={type} value={type} className="bg-[#191919]">
                {type}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={onDelete}
          className="p-1.5 rounded hover:bg-red-500/20 text-[#6b6b6b] hover:text-red-400 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* 섹션 내용 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 영상 설명 */}
        <div>
          <label className="block text-xs text-[#9b9a97] mb-1">영상</label>
          <textarea
            value={section.videoDescription}
            onChange={(e) => handleChange('videoDescription', e.target.value)}
            placeholder="영상 내용을 입력하세요..."
            className="w-full bg-[#1a1a1a] text-white text-sm p-2 rounded border border-[#333] focus:border-[#555] outline-none resize-none min-h-[80px]"
          />
        </div>

        {/* 대본 */}
        <div>
          <label className="block text-xs text-[#9b9a97] mb-1">
            대본 (나레이션)
          </label>
          <textarea
            value={section.script}
            onChange={(e) => handleChange('script', e.target.value)}
            placeholder="대본을 입력하세요..."
            className="w-full bg-[#1a1a1a] text-white text-sm p-2 rounded border border-[#333] focus:border-[#555] outline-none resize-none min-h-[80px]"
          />
        </div>

        {/* 특이사항 */}
        <div>
          <label className="block text-xs text-[#9b9a97] mb-1">특이사항</label>
          <textarea
            value={section.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="특이사항을 입력하세요..."
            className="w-full bg-[#1a1a1a] text-white text-sm p-2 rounded border border-[#333] focus:border-[#555] outline-none resize-none min-h-[60px]"
          />
        </div>

        {/* 소스 */}
        <div>
          <label className="block text-xs text-[#9b9a97] mb-1">소스</label>
          <input
            type="text"
            value={section.sourceInfo}
            onChange={(e) => handleChange('sourceInfo', e.target.value)}
            placeholder="자막과 어울리는 소스 사용"
            className="w-full bg-[#1a1a1a] text-white text-sm p-2 rounded border border-[#333] focus:border-[#555] outline-none"
          />
        </div>

        {/* 효과 */}
        <div className="md:col-span-2">
          <label className="block text-xs text-[#9b9a97] mb-1">효과</label>
          <input
            type="text"
            value={section.effectInfo}
            onChange={(e) => handleChange('effectInfo', e.target.value)}
            placeholder="폭죽 이펙트 추가할 수 있으면 추가"
            className="w-full bg-[#1a1a1a] text-white text-sm p-2 rounded border border-[#333] focus:border-[#555] outline-none"
          />
        </div>
      </div>
    </div>
  );
}

