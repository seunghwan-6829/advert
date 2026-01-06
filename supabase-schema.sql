-- 기획안 관리 시스템 Supabase 스키마
-- 이 SQL을 Supabase 대시보드 > SQL Editor에서 실행하세요

-- 기존 테이블 삭제 (필요시)
DROP TABLE IF EXISTS plans;
DROP TABLE IF EXISTS brands;

-- 브랜드(프로젝트) 테이블
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo TEXT,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기획안 테이블
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  storyboard JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_plans_brand_id ON plans(brand_id);
CREATE INDEX idx_brands_order ON brands("order");

-- RLS (Row Level Security) 비활성화 (테스트용)
-- 실제 운영 환경에서는 적절한 RLS 정책을 설정하세요
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기/쓰기 가능하도록 정책 추가 (테스트용)
CREATE POLICY "Allow all operations on brands" ON brands FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on plans" ON plans FOR ALL USING (true) WITH CHECK (true);
