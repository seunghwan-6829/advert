'use client';

import { useState, useEffect } from 'react';
import { Plus, FileText, Home, LogOut, FolderKanban, GripVertical, Pencil, Trash2, User } from 'lucide-react';
import Link from 'next/link';
import { Plan, Brand } from '@/types/plan';
import { useAuth } from '@/lib/AuthContext';
import { getBrands, createBrand, updateBrand, deleteBrand } from '@/lib/store';
import AccessDeniedModal from './AccessDeniedModal';
import BrandModal from './BrandModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import AuthModal from './AuthModal';

interface SidebarProps {
  plans: Plan[];
  currentPlanId?: string;
  selectedBrandId?: string | null;
  onSelectBrand?: (brandId: string | null) => void;
}

export default function Sidebar({ plans, currentPlanId, selectedBrandId, onSelectBrand }: SidebarProps) {
  const { user, isAdmin, permissions, signOut, isLoading } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isManageMode, setIsManageMode] = useState(false);

  // 권한 체크: 관리자이거나 프로젝트 열람 권한이 있는 경우
  const canViewProjects = isAdmin || permissions?.canViewProjects;
  
  // 허용된 브랜드 필터링
  // - 관리자: 모든 브랜드
  // - canViewProjects가 true이고 allowedBrandIds가 비어있음: 전체 브랜드
  // - canViewProjects가 true이고 allowedBrandIds에 값이 있음: 해당 브랜드만
  const visibleBrands = isAdmin 
    ? brands 
    : (permissions?.canViewProjects && permissions?.allowedBrandIds?.length === 0)
      ? brands  // 전체 접근
      : brands.filter(b => permissions?.allowedBrandIds?.includes(b.id));
  
  // 모달 상태
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    const data = await getBrands();
    setBrands(data);
  };

  // 브랜드 선택
  const handleSelectBrand = (brandId: string) => {
    if (onSelectBrand) {
      // 같은 브랜드 클릭 시 선택 해제 (전체 보기)
      onSelectBrand(selectedBrandId === brandId ? null : brandId);
    }
  };

  // 프로젝트 관리 클릭
  const handleManageClick = () => {
    if (!isAdmin) {
      setShowAccessDenied(true);
      return;
    }
    setIsManageMode(!isManageMode);
  };

  // + 버튼 클릭
  const handleAddClick = () => {
    if (!isAdmin) {
      setShowAccessDenied(true);
      return;
    }
    setEditingBrand(null);
    setShowBrandModal(true);
  };

  // 브랜드 생성
  const handleCreateBrand = async (data: { name: string; logo?: string }) => {
    await createBrand(data);
    await loadBrands();
  };

  // 브랜드 수정
  const handleEditBrand = (brand: Brand) => {
    setEditingBrand(brand);
    setShowBrandModal(true);
  };

  const handleUpdateBrand = async (data: { name: string; logo?: string }) => {
    if (editingBrand) {
      await updateBrand(editingBrand.id, data);
      await loadBrands();
    }
  };

  // 브랜드 삭제
  const handleDeleteClick = (brand: Brand) => {
    setDeletingBrand(brand);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingBrand) {
      setIsDeleting(true);
      await deleteBrand(deletingBrand.id);
      await loadBrands();
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeletingBrand(null);
    }
  };

  // 로그아웃
  const handleLogout = async () => {
    await signOut();
    setIsManageMode(false);
  };

  // 로그인/회원가입 모달 열기
  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode);
    setShowAuthModal(true);
  };

  // 브랜드별 기획안 필터링
  const getPlansByBrand = (brandId: string) => {
    return plans.filter(p => p.brandId === brandId);
  };

  return (
    <>
      <aside className="w-60 h-screen bg-white flex flex-col border-r border-[#f0e6dc] fixed left-0 top-0">
        {/* 로고 영역 */}
        <div className="p-4 pb-2">
          <img 
            src="/logo.svg" 
            alt="re:boot" 
            className="h-7 w-auto"
          />
        </div>

        {/* 홈 버튼 */}
        <div className="px-4 pb-4 border-b border-[#f0e6dc]">
          <Link href="/">
            <div className="flex items-center gap-2 px-2 py-2 text-sm text-[#6b7280] hover:text-[#f97316] hover:bg-[#fff7ed] rounded-lg transition-colors cursor-pointer">
              <Home size={16} />
              <span>홈</span>
            </div>
          </Link>
        </div>

        {/* 회원가입/로그인 또는 사용자 정보 */}
        <div className="p-3 border-b border-[#f0e6dc]">
          {isLoading ? (
            <div className="flex items-center gap-2 px-2 py-2 bg-[#f5f5f5] rounded-lg animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gray-200"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ) : user ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-2 py-2 bg-[#fff7ed] rounded-lg">
                <div className="w-8 h-8 rounded-full bg-[#f97316] flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1a1a1a] truncate">
                    {user.email?.split('@')[0]}
                  </p>
                  {isAdmin && (
                    <p className="text-xs text-[#f97316]">관리자</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={() => openAuthModal('signup')}
                className="flex-1 py-2 px-3 bg-[#f97316] text-white text-sm font-medium rounded-lg hover:bg-[#ea580c] transition-colors"
              >
                회원가입
              </button>
              <button 
                onClick={() => openAuthModal('login')}
                className="flex-1 py-2 px-3 bg-white border border-[#f0e6dc] text-[#1a1a1a] text-sm font-medium rounded-lg hover:bg-[#fff7ed] transition-colors"
              >
                로그인
              </button>
            </div>
          )}
        </div>

        {/* 프로젝트 관리 - 권한이 있는 경우만 표시 */}
        {canViewProjects && (
          <div className="px-3 pt-4">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={handleManageClick}
                className={`text-sm font-medium flex items-center gap-2 px-2 py-1 rounded-lg transition-colors ${
                  isManageMode 
                    ? 'text-[#f97316] bg-[#fff7ed]' 
                    : 'text-[#1a1a1a] hover:bg-[#fff7ed]'
                }`}
              >
                <FolderKanban size={16} />
                프로젝트 관리
              </button>
              {isAdmin && (
                <button 
                  onClick={handleAddClick}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#fff7ed] text-[#6b7280] hover:text-[#f97316] transition-colors"
                >
                  <Plus size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* 브랜드/프로젝트 목록 - 권한이 있는 경우만 표시 */}
        {canViewProjects && (
          <div className="flex-1 overflow-y-auto px-3">
            <nav className="space-y-1">
              {visibleBrands.length === 0 ? (
                <p className="text-xs text-[#9ca3af] px-2 py-4">
                  {isAdmin ? '아직 프로젝트가 없습니다' : '열람 가능한 프로젝트가 없습니다'}
                </p>
              ) : (
                <>
                  {/* 브랜드 목록 */}
                  {visibleBrands.map((brand) => {
                  const brandPlans = getPlansByBrand(brand.id);
                  const isSelected = selectedBrandId === brand.id;
                  
                  return (
                    <div key={brand.id} className="mb-1">
                      {/* 브랜드 버튼 */}
                      <div className="flex items-center group">
                        {isManageMode && (
                          <div className="p-1 cursor-grab text-[#9ca3af] hover:text-[#6b7280]">
                            <GripVertical size={14} />
                          </div>
                        )}
                        
                        <button
                          onClick={() => handleSelectBrand(brand.id)}
                          className={`flex-1 flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${
                            isSelected
                              ? 'bg-[#fff7ed] text-[#f97316] font-medium'
                              : 'text-[#4b5563] hover:bg-[#fff7ed]'
                          }`}
                        >
                          {brand.logo ? (
                            <img src={brand.logo} alt="" className="w-5 h-5 rounded object-cover" />
                          ) : (
                            <div className={`w-5 h-5 rounded flex items-center justify-center text-xs font-medium ${
                              isSelected ? 'bg-[#f97316] text-white' : 'bg-[#fed7aa] text-[#c2410c]'
                            }`}>
                              {brand.name.charAt(0)}
                            </div>
                          )}
                          
                          <span className="truncate">{brand.name}</span>
                          <span className="text-xs text-[#9ca3af]">({brandPlans.length})</span>
                        </button>

                        {isManageMode && (
                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditBrand(brand)}
                              className="p-1 rounded hover:bg-[#fff7ed] text-[#9ca3af] hover:text-[#f97316]"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(brand)}
                              className="p-1 rounded hover:bg-[#fef2f2] text-[#9ca3af] hover:text-[#ef4444]"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                  })}
                </>
              )}
            </nav>
          </div>
        )}

        {/* 권한 없는 경우 안내 메시지 */}
        {!canViewProjects && user && (
          <div className="flex-1 px-3 pt-4">
            <p className="text-xs text-[#9ca3af] px-2 py-4 text-center">
              프로젝트 열람 권한이 없습니다.<br />
              관리자에게 문의하세요.
            </p>
          </div>
        )}

        {/* 하단 메뉴 - 로그인 한 경우만 표시 */}
        {user && (
          <div className="p-3 border-t border-[#f0e6dc] space-y-1">
            {/* 관리자 전용 페이지 - 관리자만 표시 */}
            {isAdmin && (
              <Link href="/admin">
                <button className="w-full px-3 py-2 mb-1 bg-[#1a1a1a] rounded-lg hover:bg-[#333333] transition-colors">
                  <p className="text-sm text-white font-medium text-center">관리자 전용 페이지</p>
                </button>
              </Link>
            )}
            
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-white bg-[#f97316] hover:bg-[#ea580c] transition-colors"
            >
              <LogOut size={16} />
              <span>로그아웃</span>
            </button>
          </div>
        )}
      </aside>

      {/* 모달들 */}
      <AccessDeniedModal 
        isOpen={showAccessDenied} 
        onClose={() => setShowAccessDenied(false)} 
      />
      
      <BrandModal
        isOpen={showBrandModal}
        onClose={() => {
          setShowBrandModal(false);
          setEditingBrand(null);
        }}
        onSave={editingBrand ? handleUpdateBrand : handleCreateBrand}
        brand={editingBrand}
        mode={editingBrand ? 'edit' : 'create'}
      />

      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingBrand(null);
        }}
        onConfirm={handleConfirmDelete}
        title="프로젝트 삭제"
        message={`"${deletingBrand?.name}" 프로젝트를 정말 삭제하시겠습니까? 이 프로젝트에 포함된 기획안들도 함께 삭제됩니다.`}
        isLoading={isDeleting}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authModalMode}
      />
    </>
  );
}
