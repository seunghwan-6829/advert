// 기획안 타입 정의

// 브랜드 (프로젝트/폴더) 타입
export interface Brand {
  id: string;
  name: string;
  logo?: string; // 로고 URL 또는 base64
  order: number; // 정렬 순서
  createdAt: string;
  updatedAt: string;
}

// 스토리보드 아이템 (가로 열 방식)
export interface StoryboardItem {
  id: string;
  order: number;
  image?: string; // 영상/이미지 (base64 또는 URL)
  source: string; // 소스
  effect: string; // 효과
  note: string; // 특이사항
  narration: string; // 대본/나레이션
}

// 행 높이 설정
export interface RowHeights {
  image: number;
  source: number;
  effect: number;
  note: number;
  narration: number;
}

export interface Plan {
  id: string;
  brandId: string; // 소속 브랜드 ID (필수)
  title: string; // 기획안 제목
  ctaText?: string; // CTA 문장
  summary?: string; // 카드 미리보기 텍스트
  storyboard: StoryboardItem[]; // 스토리보드
  rowHeights?: RowHeights; // 행 높이 설정 (선택)
  createdAt: string;
  updatedAt: string;
}

export interface PlanFormData {
  title: string;
  brandId: string;
  storyboard: Omit<StoryboardItem, 'id'>[];
}
