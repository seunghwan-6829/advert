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

export interface PlanSection {
  id: string;
  sectionType: string; // "상단CTA", "상단CTA_베리1", "상단CTA_베리2", "본문내용"
  videoDescription: string; // 영상 설명
  script: string; // 대본(나레이션)
  notes: string; // 특이사항
  sourceInfo: string; // 소스
  effectInfo: string; // 효과
}

export interface Plan {
  id: string;
  brandId?: string; // 소속 브랜드 ID
  title: string; // 예: "바랑소리_에거코퍼레이션_250924"
  videoNumber: number; // 영상 번호 (1번, 2번...)
  sourceCost: number; // 소스 비용
  productionCost: number; // 제작 비용
  rfLink: string; // RF 링크
  videoLength: string; // 영상 길이
  referenceNote: string; // 참고 정보
  keywords: string[]; // 들어가야 하는 키워드
  sections: PlanSection[];
  createdAt: string;
  updatedAt: string;
}

export interface PlanFormData {
  title: string;
  brandId?: string;
  videoNumber: number;
  sourceCost: number;
  productionCost: number;
  rfLink: string;
  videoLength: string;
  referenceNote: string;
  keywords: string[];
  sections: Omit<PlanSection, 'id'>[];
}

// 섹션 타입 옵션
export const SECTION_TYPES = [
  '상단CTA',
  '상단CTA_베리버전1',
  '상단CTA_베리버전2',
  '본문내용',
] as const;

export type SectionType = typeof SECTION_TYPES[number];
