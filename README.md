# 기획안 관리 (Advert)

영상 기획안을 효율적으로 관리하는 노션 스타일 웹 애플리케이션입니다.

## 기능

- ✅ 기획안 생성/수정/삭제
- ✅ 노션 스타일 다크 UI
- ✅ 섹션별 관리 (상단CTA, 본문내용 등)
- ✅ 키워드 태그 관리
- ✅ 비용 관리 (소스/제작)
- ✅ 로컬 스토리지 저장 (Supabase 없이도 동작)
- ✅ Supabase 연동 지원

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## Supabase 연동 (선택사항)

### 1. Supabase 프로젝트 생성

[https://supabase.com](https://supabase.com)에서 새 프로젝트를 생성하세요.

### 2. 테이블 생성

Supabase Dashboard > SQL Editor에서 `supabase-schema.sql` 파일의 내용을 실행하세요.

### 3. 환경 변수 설정

`.env.local.example`을 `.env.local`로 복사하고 값을 입력하세요:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Supabase Dashboard > Settings > API에서 URL과 anon key를 확인할 수 있습니다.

## 배포 (Vercel)

### 1. GitHub에 푸시

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/advert.git
git push -u origin main
```

### 2. Vercel 연동

1. [https://vercel.com](https://vercel.com) 접속
2. "Import Project" 클릭
3. GitHub 저장소 선택
4. Environment Variables에 Supabase 키 추가
5. Deploy!

## 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL) / Local Storage
- **Icons**: Lucide React
- **Language**: TypeScript

## 프로젝트 구조

```
advert/
├── app/
│   ├── page.tsx              # 메인 페이지 (목록)
│   ├── layout.tsx            # 레이아웃
│   ├── globals.css           # 글로벌 스타일
│   └── plan/
│       ├── new/page.tsx      # 새 기획안
│       └── [id]/page.tsx     # 기획안 상세/수정
├── components/
│   ├── Sidebar.tsx           # 사이드바
│   ├── PlanCard.tsx          # 기획안 카드
│   └── SectionEditor.tsx     # 섹션 에디터
├── lib/
│   ├── supabase.ts           # Supabase 클라이언트
│   └── store.ts              # 데이터 저장 로직
├── types/
│   └── plan.ts               # 타입 정의
└── supabase-schema.sql       # DB 스키마
```

## 라이선스

MIT
