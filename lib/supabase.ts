import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Supabase가 설정되었는지 확인
// 현재는 로컬 저장소만 사용 (Supabase 테이블 설정 전까지)
export const isSupabaseConfigured = () => {
  return false; // 로컬 저장소 사용
  // return !!supabaseUrl && !!supabaseAnonKey;
};

// Supabase 클라이언트 (설정된 경우에만 생성)
let supabaseClient: SupabaseClient | null = null;

if (isSupabaseConfigured()) {
  supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!);
}

export const supabase = supabaseClient;
