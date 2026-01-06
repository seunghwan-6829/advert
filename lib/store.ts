import { Plan, StoryboardItem, Brand } from '@/types/plan';
import { v4 as uuidv4 } from 'uuid';
import { supabase, useSupabaseDB } from './supabase';

const STORAGE_KEY = 'advert_plans_v2'; // 새 버전 (스토리보드 형식)
const BRANDS_STORAGE_KEY = 'advert_brands';

// ==================== 브랜드 관련 함수 ====================

// 로컬 스토리지에서 브랜드 불러오기
const getLocalBrands = (): Brand[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(BRANDS_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

// 로컬 스토리지에 브랜드 저장
const setLocalBrands = (brands: Brand[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BRANDS_STORAGE_KEY, JSON.stringify(brands));
};

// 모든 브랜드 가져오기
export const getBrands = async (): Promise<Brand[]> => {
  if (useSupabaseDB() && supabase) {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .order('order', { ascending: true });
    
    if (error) {
      console.error('Supabase error:', error);
      return getLocalBrands();
    }
    
    return data?.map(transformBrandFromSupabase) || [];
  }
  
  return getLocalBrands().sort((a, b) => a.order - b.order);
};

// 단일 브랜드 가져오기
export const getBrandById = async (id: string): Promise<Brand | null> => {
  if (useSupabaseDB() && supabase) {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      return getLocalBrands().find((b) => b.id === id) || null;
    }
    
    return data ? transformBrandFromSupabase(data) : null;
  }
  
  return getLocalBrands().find((b) => b.id === id) || null;
};

// 브랜드 생성
export const createBrand = async (brandData: { name: string; logo?: string }): Promise<Brand> => {
  const now = new Date().toISOString();
  const brands = await getBrands();
  const maxOrder = brands.length > 0 ? Math.max(...brands.map(b => b.order)) : 0;
  
  const newBrand: Brand = {
    id: uuidv4(),
    name: brandData.name,
    logo: brandData.logo,
    order: maxOrder + 1,
    createdAt: now,
    updatedAt: now,
  };

  if (useSupabaseDB() && supabase) {
    const { error } = await supabase
      .from('brands')
      .insert(transformBrandToSupabase(newBrand));
    
    if (error) {
      console.error('Supabase error:', error);
      const localBrands = getLocalBrands();
      setLocalBrands([...localBrands, newBrand]);
    }
  } else {
    const localBrands = getLocalBrands();
    setLocalBrands([...localBrands, newBrand]);
  }

  return newBrand;
};

// 브랜드 수정
export const updateBrand = async (id: string, brandData: Partial<Brand>): Promise<Brand | null> => {
  const now = new Date().toISOString();
  
  if (useSupabaseDB() && supabase) {
    const { data, error } = await supabase
      .from('brands')
      .update({ ...transformBrandToSupabase(brandData as Brand), updated_at: now })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      return updateLocalBrand(id, brandData, now);
    }
    
    return data ? transformBrandFromSupabase(data) : null;
  }
  
  return updateLocalBrand(id, brandData, now);
};

const updateLocalBrand = (id: string, brandData: Partial<Brand>, now: string): Brand | null => {
  const brands = getLocalBrands();
  const index = brands.findIndex((b) => b.id === id);
  
  if (index === -1) return null;
  
  const updatedBrand = {
    ...brands[index],
    ...brandData,
    updatedAt: now,
  };
  
  brands[index] = updatedBrand;
  setLocalBrands(brands);
  
  return updatedBrand;
};

// 브랜드 삭제
export const deleteBrand = async (id: string): Promise<boolean> => {
  if (useSupabaseDB() && supabase) {
    // 먼저 해당 브랜드의 기획안들의 brandId를 null로 설정
    await supabase
      .from('plans')
      .update({ brand_id: null })
      .eq('brand_id', id);
    
    const { error } = await supabase
      .from('brands')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Supabase error:', error);
      return deleteLocalBrand(id);
    }
    
    return true;
  }
  
  return deleteLocalBrand(id);
};

const deleteLocalBrand = (id: string): boolean => {
  // 해당 브랜드의 기획안들도 함께 삭제
  const plans = getLocalPlans();
  const filteredPlans = plans.filter(p => p.brandId !== id);
  setLocalPlans(filteredPlans);
  
  // 브랜드 삭제
  const brands = getLocalBrands();
  const filtered = brands.filter((b) => b.id !== id);
  setLocalBrands(filtered);
  return true;
};

// 브랜드 순서 변경
export const reorderBrands = async (brandIds: string[]): Promise<void> => {
  const updates = brandIds.map((id, index) => ({ id, order: index }));
  
  if (useSupabaseDB() && supabase) {
    for (const update of updates) {
      await supabase
        .from('brands')
        .update({ order: update.order })
        .eq('id', update.id);
    }
  } else {
    const brands = getLocalBrands();
    const updatedBrands = brands.map(brand => {
      const update = updates.find(u => u.id === brand.id);
      return update ? { ...brand, order: update.order } : brand;
    });
    setLocalBrands(updatedBrands);
  }
};

// 브랜드별 기획안 가져오기
export const getPlansByBrandId = async (brandId: string): Promise<Plan[]> => {
  const plans = await getPlans();
  return plans.filter(p => p.brandId === brandId);
};

// Supabase 브랜드 데이터 변환
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformBrandFromSupabase = (data: any): Brand => ({
  id: data.id,
  name: data.name,
  logo: data.logo,
  order: data.order || 0,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

const transformBrandToSupabase = (brand: Partial<Brand>) => ({
  ...(brand.id && { id: brand.id }),
  ...(brand.name && { name: brand.name }),
  ...(brand.logo !== undefined && { logo: brand.logo }),
  ...(brand.order !== undefined && { order: brand.order }),
  ...(brand.createdAt && { created_at: brand.createdAt }),
  ...(brand.updatedAt && { updated_at: brand.updatedAt }),
});

// ==================== 기획안 관련 함수 ====================

// 로컬 스토리지에서 데이터 불러오기
const getLocalPlans = (): Plan[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

// 로컬 스토리지에 데이터 저장
const setLocalPlans = (plans: Plan[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
};

// 모든 기획안 가져오기
export const getPlans = async (): Promise<Plan[]> => {
  if (useSupabaseDB() && supabase) {
    // Supabase에서 가져오기
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error:', error);
      return getLocalPlans();
    }
    
    return data?.map(transformFromSupabase) || [];
  }
  
  return getLocalPlans();
};

// 단일 기획안 가져오기
export const getPlanById = async (id: string): Promise<Plan | null> => {
  if (useSupabaseDB() && supabase) {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      return getLocalPlans().find((p) => p.id === id) || null;
    }
    
    return data ? transformFromSupabase(data) : null;
  }
  
  return getLocalPlans().find((p) => p.id === id) || null;
};

// 기획안 생성
export const createPlan = async (planData: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>): Promise<Plan> => {
  const now = new Date().toISOString();
  const newPlan: Plan = {
    ...planData,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };

  if (useSupabaseDB() && supabase) {
    const { error } = await supabase
      .from('plans')
      .insert(transformToSupabase(newPlan));
    
    if (error) {
      console.error('Supabase error:', error);
      // 폴백: 로컬에 저장
      const plans = getLocalPlans();
      setLocalPlans([newPlan, ...plans]);
    }
  } else {
    const plans = getLocalPlans();
    setLocalPlans([newPlan, ...plans]);
  }

  return newPlan;
};

// 기획안 수정
export const updatePlan = async (id: string, planData: Partial<Plan>): Promise<Plan | null> => {
  const now = new Date().toISOString();
  
  if (useSupabaseDB() && supabase) {
    const { data, error } = await supabase
      .from('plans')
      .update({ ...transformToSupabase(planData as Plan), updated_at: now })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      return updateLocalPlan(id, planData, now);
    }
    
    return data ? transformFromSupabase(data) : null;
  }
  
  return updateLocalPlan(id, planData, now);
};

const updateLocalPlan = (id: string, planData: Partial<Plan>, now: string): Plan | null => {
  const plans = getLocalPlans();
  const index = plans.findIndex((p) => p.id === id);
  
  if (index === -1) return null;
  
  const updatedPlan = {
    ...plans[index],
    ...planData,
    updatedAt: now,
  };
  
  plans[index] = updatedPlan;
  setLocalPlans(plans);
  
  return updatedPlan;
};

// 기획안 삭제
export const deletePlan = async (id: string): Promise<boolean> => {
  if (useSupabaseDB() && supabase) {
    const { error } = await supabase
      .from('plans')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Supabase error:', error);
      return deleteLocalPlan(id);
    }
    
    return true;
  }
  
  return deleteLocalPlan(id);
};

const deleteLocalPlan = (id: string): boolean => {
  const plans = getLocalPlans();
  const filtered = plans.filter((p) => p.id !== id);
  setLocalPlans(filtered);
  return true;
};

// 빈 스토리보드 아이템 생성
export const createEmptyStoryboardItem = (order: number = 0): StoryboardItem => ({
  id: uuidv4(),
  order,
  scene: '',
  narration: '',
  note: '',
});

// Supabase 데이터 변환 (snake_case <-> camelCase)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformFromSupabase = (data: any): Plan => ({
  id: data.id,
  brandId: data.brand_id,
  title: data.title,
  storyboard: data.storyboard || [],
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

const transformToSupabase = (plan: Plan) => ({
  id: plan.id,
  brand_id: plan.brandId,
  title: plan.title,
  storyboard: plan.storyboard,
  created_at: plan.createdAt,
  updated_at: plan.updatedAt,
});
