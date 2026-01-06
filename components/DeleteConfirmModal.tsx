'use client';

import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
}

export default function DeleteConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  isLoading 
}: DeleteConfirmModalProps) {
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
          <div className="inline-flex p-4 rounded-2xl bg-[#fef3c7] mb-4">
            <AlertTriangle size={40} className="text-[#f59e0b]" />
          </div>
          
          <h2 className="text-xl font-bold text-[#1a1a1a] mb-2">
            {title}
          </h2>
          
          <p className="text-[#6b7280] mb-6">
            {message}
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={isLoading}
            >
              취소
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-[#ef4444] text-white rounded-lg hover:bg-[#dc2626] transition-colors font-medium disabled:opacity-50"
            >
              {isLoading ? '삭제 중...' : '삭제'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

