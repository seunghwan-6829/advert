'use client';

import { useState, useRef, useEffect } from 'react';
import { Brand } from '@/types/plan';
import { X, Upload } from 'lucide-react';

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

  useEffect(() => {
    if (isOpen && brand) {
      setName(brand.name || '');
      setLogo(brand.logo);
    } else if (isOpen && !brand) {
      setName('');
      setLogo(undefined);
    }
  }, [isOpen, brand]);

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
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* 모달 */}
      <div className="relative bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[#1a1a1a]">
            {mode === 'create' ? '새 프로젝트 추가' : '프로젝트 수정'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#f5f5f5] text-[#9ca3af] hover:text-[#1a1a1a] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 로고 업로드 */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-[#6b7280] mb-2">
            프로젝트 로고 (선택)
          </label>
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#e5e7eb] rounded-xl p-4 cursor-pointer hover:border-[#f97316] hover:bg-[#fff7ed] transition-all"
          >
            {logo ? (
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img src={logo} alt="로고" className="w-16 h-16 rounded-xl object-cover" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveLogo();
                    }}
                    className="absolute -top-2 -right-2 p-1 bg-[#ef4444] rounded-full text-white hover:bg-[#dc2626] transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1a1a1a]">이미지 변경</p>
                  <p className="text-xs text-[#9ca3af]">클릭하여 다른 이미지 선택</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#fff7ed] flex items-center justify-center">
                  <Upload size={20} className="text-[#f97316]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1a1a1a]">이미지 선택</p>
                  <p className="text-xs text-[#9ca3af]">PNG, JPG (최대 2MB)</p>
                </div>
              </div>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
        </div>

        {/* 프로젝트 이름 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#6b7280] mb-2">
            프로젝트 이름
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="예: 브랜드A, 클라이언트B"
            className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-white text-sm focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20 outline-none transition-all"
            autoFocus
          />
        </div>

        {/* 버튼들 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-[#e5e7eb] bg-white text-[#6b7280] font-medium hover:bg-[#f5f5f5] transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || isLoading}
            className="flex-1 px-4 py-3 rounded-xl bg-[#f97316] text-white font-medium hover:bg-[#ea580c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '저장 중...' : mode === 'create' ? '추가' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
