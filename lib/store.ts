import { Plan, PlanSection } from '@/types/plan';
import { v4 as uuidv4 } from 'uuid';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEY = 'advert_plans';

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
  if (isSupabaseConfigured() && supabase) {
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
  if (isSupabaseConfigured() && supabase) {
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

  if (isSupabaseConfigured() && supabase) {
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
  
  if (isSupabaseConfigured() && supabase) {
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
  if (isSupabaseConfigured() && supabase) {
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

// 빈 섹션 생성
export const createEmptySection = (sectionType: string = '상단CTA'): PlanSection => ({
  id: uuidv4(),
  sectionType,
  videoDescription: '',
  script: '',
  notes: '',
  sourceInfo: '자막과 어울리는 소스 사용',
  effectInfo: '',
});

// Supabase 데이터 변환 (snake_case <-> camelCase)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformFromSupabase = (data: any): Plan => ({
  id: data.id,
  title: data.title,
  videoNumber: data.video_number,
  sourceCost: data.source_cost,
  productionCost: data.production_cost,
  rfLink: data.rf_link,
  videoLength: data.video_length,
  referenceNote: data.reference_note,
  keywords: data.keywords || [],
  sections: data.sections || [],
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

const transformToSupabase = (plan: Plan) => ({
  id: plan.id,
  title: plan.title,
  video_number: plan.videoNumber,
  source_cost: plan.sourceCost,
  production_cost: plan.productionCost,
  rf_link: plan.rfLink,
  video_length: plan.videoLength,
  reference_note: plan.referenceNote,
  keywords: plan.keywords,
  sections: plan.sections,
  created_at: plan.createdAt,
  updated_at: plan.updatedAt,
});
