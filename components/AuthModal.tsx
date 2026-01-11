'use client';

import { useState } from 'react';
import { X, Mail, Lock, Eye, EyeOff, UserPlus, LogIn, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
}

export default function AuthModal({ isOpen, onClose, defaultMode = 'login' }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
      } else {
        onClose();
        resetForm();
      }
    } else {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error);
      } else {
        setSuccess('회원가입이 완료되었습니다! 이메일을 확인해주세요.');
      }
    }

    setIsLoading(false);
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    resetForm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 모달 */}
      <div className="relative bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-fade-in-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[#f3f4f6] text-[#9ca3af] hover:text-[#6b7280] transition-colors"
        >
          <X size={20} />
        </button>

        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-[#fff7ed] mb-4">
            {mode === 'login' ? (
              <LogIn size={32} className="text-[#f97316]" />
            ) : (
              <UserPlus size={32} className="text-[#f97316]" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-[#1a1a1a]">
            {mode === 'login' ? '로그인' : '회원가입'}
          </h2>
          <p className="text-[#6b7280] mt-2">
            {mode === 'login' 
              ? '계정에 로그인하세요' 
              : '새 계정을 만들어보세요'
            }
          </p>
        </div>

        {/* 성공 메시지 */}
        {success && (
          <div className="mb-6 p-4 bg-[#dcfce7] border border-[#bbf7d0] rounded-xl flex items-center gap-3">
            <CheckCircle size={20} className="text-[#22c55e]" />
            <p className="text-sm text-[#15803d]">{success}</p>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-[#fef2f2] border border-[#fecaca] rounded-xl">
            <p className="text-sm text-[#ef4444]">{error}</p>
          </div>
        )}

        {/* 폼 */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 이메일 */}
          <div>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '14px', 
              fontWeight: 500, 
              color: '#374151',
              marginBottom: '8px'
            }}>
              <Mail size={14} style={{ color: '#f97316' }} />
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                backgroundColor: '#fff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              autoComplete="email"
            />
          </div>

          {/* 비밀번호 */}
          <div>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '14px', 
              fontWeight: 500, 
              color: '#374151',
              marginBottom: '8px'
            }}>
              <Lock size={14} style={{ color: '#f97316' }} />
              비밀번호
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6자 이상 입력"
                style={{
                  width: '100%',
                  padding: '12px 48px 12px 16px',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '4px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9ca3af'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* 비밀번호 확인 (회원가입 시) */}
          {mode === 'signup' && (
            <div>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                fontSize: '14px', 
                fontWeight: 500, 
                color: '#374151',
                marginBottom: '8px'
              }}>
                <Lock size={14} style={{ color: '#f97316' }} />
                비밀번호 확인
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호 재입력"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                autoComplete="new-password"
              />
            </div>
          )}

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              marginTop: '8px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#f97316',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1
            }}
          >
            {isLoading 
              ? '처리 중...' 
              : mode === 'login' ? '로그인' : '회원가입'
            }
          </button>
        </form>

        {/* 모드 전환 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-[#6b7280]">
            {mode === 'login' ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}
            <button
              onClick={switchMode}
              className="ml-2 text-[#f97316] font-medium hover:underline"
            >
              {mode === 'login' ? '회원가입' : '로그인'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

