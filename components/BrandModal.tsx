'use client';

import { useState, useRef } from 'react';
import { Brand } from '@/types/plan';
import { X, Upload, Image as ImageIcon } from 'lucide-react';

interface BrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; logo?: string }) => void;
  brand?: Brand | null; // 수정 모드일 때
  mode: 'create' | 'edit';
}

export default function BrandModal({ isOpen, onClose, onSave, brand, mode }: BrandModalProps) {
  const [name, setName] = useState(brand?.name || '');
  const [logo, setLogo] = useState<string | undefined>(brand?.logo);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogo(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    
    setIsLoading(true);
    await onSave({ name: name.trim(), logo });
    setIsLoading(false);
    onClose();
    setName('');
    setLogo(undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim()) {
      handleSave();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 모달 */}
      <div className="relative bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[#1a1a1a]">
            {mode === 'create' ? '새 프로젝트 추가' : '프로젝트 수정'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#fff7ed] text-[#9ca3af] hover:text-[#f97316] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 로고 업로드 */}
        <div className="mb-5">
          <label className="field-label">
            <ImageIcon size={14} className="text-[#f97316]" />
            프로젝트 로고 (선택)
          </label>
          
          <div className="flex items-center gap-4">
            {logo ? (
              <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#f0e6dc]">
                <img src={logo} alt="로고" className="w-full h-full object-cover" />
                <button
                  onClick={handleRemoveLogo}
                  className="absolute -top-1 -right-1 p-1 bg-[#ef4444] rounded-full text-white hover:bg-[#dc2626] transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 rounded-xl border-2 border-dashed border-[#fed7aa] flex items-center justify-center cursor-pointer hover:border-[#f97316] hover:bg-[#fff7ed] transition-all"
              >
                <Upload size={20} className="text-[#f97316]" />
              </div>
            )}
            
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary text-sm"
              >
                이미지 선택
              </button>
              <p className="text-xs text-[#9ca3af] mt-1">PNG, JPG (최대 2MB)</p>
            </div>
          </div>
        </div>

        {/* 프로젝트 이름 */}
        <div className="mb-6">
          <label className="field-label">
            프로젝트 이름
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="예: 브랜드A, 클라이언트B"
            className="input-field"
            autoFocus
          />
        </div>

        {/* 버튼들 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 btn-secondary"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || isLoading}
            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '저장 중...' : mode === 'create' ? '추가' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
