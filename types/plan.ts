// 기획안 타입 정의

// 브랜드 (프로젝트/폴더) 타입
export interface Brand {
  id: string;
  name: string;
  logo?: string; // 로고 URL 또는 base64
  order: number; // 정렬 순서
  createdAt: string;
  updatedAt: string;
  deletedAt?: string; // 휴지통 이동 시간 (soft delete)
}

// 스토리보드 아이템 (가로 열 방식)
export interface StoryboardItem {
  id: string;
  order: number;
  image?: string; // 영상/이미지 (base64 또는 URL)
  timeline: string; // 영상 타임라인
  source: string; // 소스
  effect: string; // 효과
  note: string; // 특이사항
  narration: string; // 대본/나레이션
  sourceFiles?: (SourceFile | null)[]; // 소스 파일 (최대 3개)
}

// 행 높이 설정
export interface RowHeights {
  image: number;
  timeline: number;
  source: number;
  effect: number;
  note: number;
  narration: number;
}

// 행 순서 타입
export type RowType = 'image' | 'timeline' | 'source' | 'effect' | 'note' | 'narration';

// 소스 파일 타입
export interface SourceFile {
  name: string;      // 파일명
  data: string;      // base64 데이터
  size: number;      // 파일 크기 (bytes)
  uploadedAt: string; // 업로드 시간
}

// 기본 행 순서
export const DEFAULT_ROW_ORDER: RowType[] = ['image', 'timeline', 'source', 'effect', 'note', 'narration'];

export interface Plan {
  id: string;
  brandId: string; // 소속 브랜드 ID (필수)
  title: string; // 기획안 제목
  reference?: string; // 레퍼런스
  ctaText?: string; // CTA 문장
  summary?: string; // 카드 미리보기 텍스트
  storyboard: StoryboardItem[]; // 스토리보드
  rowHeights?: RowHeights; // 행 높이 설정 (선택)
  rowOrder?: RowType[]; // 행 순서 설정 (선택)
  isCompleted?: boolean; // 제작 완료 여부
  createdAt: string;
  updatedAt: string;
}

export interface PlanFormData {
  title: string;
  brandId: string;
  storyboard: Omit<StoryboardItem, 'id'>[];
}
