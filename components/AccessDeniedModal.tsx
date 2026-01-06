'use client';

import { ShieldAlert, X } from 'lucide-react';

interface AccessDeniedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccessDeniedModal({ isOpen, onClose }: AccessDeniedModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 모달 */}
      <div className="relative bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl animate-fade-in-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-[#f3f4f6] text-[#9ca3af] hover:text-[#6b7280] transition-colors"
        >
          <X size={20} />
        </button>
        
        <div className="text-center">
          <div className="inline-flex p-4 rounded-2xl bg-[#fef2f2] mb-4">
            <ShieldAlert size={40} className="text-[#ef4444]" />
          </div>
          
          <h2 className="text-xl font-bold text-[#1a1a1a] mb-2">
            접근 권한이 없습니다
          </h2>
          
          <p className="text-[#6b7280] mb-6">
            이 기능은 관리자만 사용할 수 있습니다.<br />
            관리자 권한이 필요합니다.
          </p>
          
          <button
            onClick={onClose}
            className="w-full btn-primary"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

