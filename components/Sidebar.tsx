'use client';

import { useState, useEffect } from 'react';
import { Plus, FileText, Home, LogOut, FolderKanban, GripVertical, Pencil, Trash2, ChevronDown, ChevronRight, User } from 'lucide-react';
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
}

export default function Sidebar({ plans, currentPlanId }: SidebarProps) {
  const { user, isAdmin, signOut, isLoading } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());
  const [isManageMode, setIsManageMode] = useState(false);
  
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

  // 브랜드 토글
  const toggleBrand = (brandId: string) => {
    const newExpanded = new Set(expandedBrands);
    if (newExpanded.has(brandId)) {
      newExpanded.delete(brandId);
    } else {
      newExpanded.add(brandId);
    }
    setExpandedBrands(newExpanded);
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

  // 브랜드에 속하지 않은 기획안들
  const unassignedPlans = plans.filter(p => !p.brandId);

  // 브랜드별 기획안 필터링
  const getPlansByBrand = (brandId: string) => {
    return plans.filter(p => p.brandId === brandId);
  };

  return (
    <>
      <aside className="w-60 h-screen bg-white flex flex-col border-r border-[#f0e6dc] fixed left-0 top-0">
        {/* 로고 영역 */}
        <div className="p-4 border-b border-[#f0e6dc]">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-[#1a1a1a]">🎬 기획안 관리</span>
          </div>
          <Link href="/">
            <div className="flex items-center gap-2 mt-2 text-sm text-[#6b7280] hover:text-[#f97316] transition-colors cursor-pointer">
              <Home size={16} />
              <span>홈</span>
            </div>
          </Link>
        </div>

        {/* 회원가입/로그인 또는 사용자 정보 */}
        <div className="p-3 border-b border-[#f0e6dc]">
          {isLoading ? (
            <div className="text-sm text-[#9ca3af] text-center py-2">로딩 중...</div>
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

        {/* 프로젝트 관리 */}
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
            <button 
              onClick={handleAddClick}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#fff7ed] text-[#6b7280] hover:text-[#f97316] transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* 브랜드/프로젝트 목록 */}
        <div className="flex-1 overflow-y-auto px-3">
          <nav className="space-y-1">
            {brands.length === 0 && unassignedPlans.length === 0 ? (
              <p className="text-xs text-[#9ca3af] px-2 py-4">
                아직 프로젝트가 없습니다
              </p>
            ) : (
              <>
                {/* 브랜드 목록 */}
                {brands.map((brand) => {
                  const brandPlans = getPlansByBrand(brand.id);
                  const isExpanded = expandedBrands.has(brand.id);
                  
                  return (
                    <div key={brand.id} className="mb-1">
                      {/* 브랜드 헤더 */}
                      <div className="flex items-center group">
                        {isManageMode && (
                          <div className="p-1 cursor-grab text-[#9ca3af] hover:text-[#6b7280]">
                            <GripVertical size={14} />
                          </div>
                        )}
                        
                        <button
                          onClick={() => toggleBrand(brand.id)}
                          className="flex-1 flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-[#4b5563] hover:bg-[#fff7ed] transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown size={14} className="text-[#f97316]" />
                          ) : (
                            <ChevronRight size={14} className="text-[#9ca3af]" />
                          )}
                          
                          {brand.logo ? (
                            <img src={brand.logo} alt="" className="w-5 h-5 rounded object-cover" />
                          ) : (
                            <div className="w-5 h-5 rounded bg-[#fed7aa] flex items-center justify-center text-xs text-[#c2410c] font-medium">
                              {brand.name.charAt(0)}
                            </div>
                          )}
                          
                          <span className="truncate font-medium">{brand.name}</span>
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

                      {/* 브랜드 내 기획안 목록 */}
                      {isExpanded && (
                        <div className="ml-6 mt-1 space-y-0.5">
                          {brandPlans.length === 0 ? (
                            <p className="text-xs text-[#9ca3af] px-2 py-1">기획안 없음</p>
                          ) : (
                            brandPlans.map((plan) => (
                              <Link key={plan.id} href={`/plan/${plan.id}`}>
                                <div
                                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm cursor-pointer transition-colors ${
                                    currentPlanId === plan.id
                                      ? 'bg-[#fff7ed] text-[#f97316]'
                                      : 'text-[#6b7280] hover:bg-[#fff7ed]'
                                  }`}
                                >
                                  <FileText size={14} />
                                  <span className="truncate">{plan.title}</span>
                                </div>
                              </Link>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* 미분류 기획안 */}
                {unassignedPlans.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#f0e6dc]">
                    <p className="text-xs text-[#9ca3af] px-2 mb-2">미분류</p>
                    {unassignedPlans.map((plan) => (
                      <Link key={plan.id} href={`/plan/${plan.id}`}>
                        <div
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm cursor-pointer transition-colors ${
                            currentPlanId === plan.id
                              ? 'bg-[#fff7ed] text-[#f97316]'
                              : 'text-[#6b7280] hover:bg-[#fff7ed]'
                          }`}
                        >
                          <FileText size={14} />
                          <span className="truncate">{plan.title}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </nav>
        </div>

        {/* 하단 메뉴 */}
        <div className="p-3 border-t border-[#f0e6dc] space-y-1">
          {/* 관리자 전용 페이지 - 테스트용으로 항상 표시 */}
          <Link href="/admin">
            <button className="w-full text-left px-3 py-2 mb-1 bg-[#f0fdf4] rounded-lg hover:bg-[#dcfce7] transition-colors">
              <p className="text-sm text-[#15803d] font-medium">관리자 전용 페이지</p>
            </button>
          </Link>
          
          {user ? (
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white bg-[#f97316] hover:bg-[#ea580c] transition-colors"
            >
              <LogOut size={16} />
              <span>로그아웃</span>
            </button>
          ) : (
            <button 
              onClick={() => openAuthModal('login')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white bg-[#f97316] hover:bg-[#ea580c] transition-colors"
            >
              <User size={16} />
              <span>로그인하기</span>
            </button>
          )}
        </div>
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
        message={`"${deletingBrand?.name}" 프로젝트를 정말 삭제하시겠습니까? 이 프로젝트에 포함된 기획안들은 미분류로 이동됩니다.`}
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
