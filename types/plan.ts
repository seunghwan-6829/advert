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

// 스토리보드 아이템
export interface StoryboardItem {
  id: string;
  order: number;
  scene: string; // 장면 설명
  narration: string; // 나레이션/대사
  note: string; // 비고/특이사항
}

export interface Plan {
  id: string;
  brandId: string; // 소속 브랜드 ID (필수)
  title: string; // 기획안 제목
  storyboard: StoryboardItem[]; // 스토리보드
  createdAt: string;
  updatedAt: string;
}

export interface PlanFormData {
  title: string;
  brandId: string;
  storyboard: Omit<StoryboardItem, 'id'>[];
}
