-- Supabase 테이블 생성 SQL
-- Supabase Dashboard > SQL Editor에서 실행하세요

-- 기획안 테이블
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  video_number INTEGER NOT NULL DEFAULT 1,
  source_cost INTEGER DEFAULT 0,
  production_cost INTEGER DEFAULT 0,
  rf_link TEXT,
  video_length TEXT,
  reference_note TEXT,
  keywords JSONB DEFAULT '[]'::jsonb,
  sections JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 업데이트 시 updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 활성화
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기/쓰기 가능 (공개 앱용)
-- 나중에 인증 추가 시 수정 필요
CREATE POLICY "Enable all access for all users" ON plans
  FOR ALL USING (true) WITH CHECK (true);

-- 인덱스 (성능 최적화)
CREATE INDEX idx_plans_created_at ON plans(created_at DESC);
CREATE INDEX idx_plans_video_number ON plans(video_number);

