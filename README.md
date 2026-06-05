# StudyFlow - 학생 관리 앱

삼성헬스 스타일의 세련된 학생/선생님 공부 관리 플랫폼

## 기술 스택
- **Frontend**: React + TypeScript + Vite + Recharts + Zustand
- **Backend**: Express + TypeScript + PostgreSQL
- **배포**: Railway

## 로컬 개발

```bash
# 의존성 설치
npm run install:all

# 환경변수 설정
cp server/.env.example server/.env
# server/.env 수정 (DATABASE_URL, JWT_SECRET)

# 개발 서버 실행 (클라이언트 + 서버 동시)
npm run dev
```

## Railway 배포

### 환경변수 설정 (Railway 대시보드)
```
DATABASE_URL=<Railway PostgreSQL 연결 URL>
JWT_SECRET=<랜덤 시크릿 키>
NODE_ENV=production
```

### 빌드/시작 커맨드
- Build: `npm run install:all && npm run build`
- Start: `npm start`

## 기능

### 학생 앱
- 공부 기록: 과목, 유형(10가지), 시간, 문제집, 정답률
- 대시보드: 오늘/주간/월간 통계, 주간 막대 그래프
- 과목별 파이 차트
- 수면 기록 및 패턴 그래프
- 공부 계획 Todo

### 선생님 앱
- 그룹 생성 및 관리
- 초대 코드로 학생 추가
- 학생별 상세 대시보드 (공부/수면/계획)
- 월별 추세, 과목 쏠림 분석
- 학생 목록 → 상세 드릴다운

## 폴더 구조
```
study-manager/
├── client/          # React 앱
│   └── src/
│       ├── pages/   # 페이지 컴포넌트
│       ├── hooks/   # Zustand store
│       ├── types/   # TypeScript 타입
│       ├── utils/   # API, 유틸리티
│       └── styles/  # 글로벌 CSS
└── server/          # Express 서버
    └── src/
        ├── routes/  # API 라우터
        ├── db/      # PostgreSQL 초기화
        └── middleware/
```
