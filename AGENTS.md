# AGENTS.md — mostprompt-web

## 프로젝트 개요

**mostprompt-web**은 LLM 프롬프트를 관리·실행·테스트할 수 있는 웹 콘솔 애플리케이션입니다.
백엔드 API 서버(Spring Boot 기반)와 연동하여 워크스페이스별로 프롬프트, LLM 모델, API 키, 실행 로그 등을 관리합니다.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript 5 |
| UI 라이브러리 | Mantine v8, @tabler/icons-react |
| 상태/데이터 페칭 | TanStack React Query v5 |
| 인증 | next-auth v5 (Google OAuth) |
| 패키지 매니저 | pnpm |
| 스타일 | Tailwind CSS v4, postcss-preset-mantine |

---

## API 서버

```
Base URL:  http://localhost:8080
API Spec:  http://localhost:8080/api-docs
Swagger:   http://localhost:8080/swagger-ui
```

### 환경 설정

- `SERVER_PHASE` 환경변수로 API URL이 결정됩니다 (`config/app-config.tsx`).
  - `local` → `http://localhost:8080`
  - `dev` → GCP Cloud Run (dev 서버)
- `.env.local`의 `SERVER_PHASE=local` 값을 확인하세요.

### API 호출 방식

- `lib/api/client.ts`의 `apiFetch<T>()` 함수를 통해 모든 API 요청을 처리합니다.
- 인증: `next-auth` 세션의 `sessionToken` (Google ID Token)을 `Authorization: Bearer` 헤더로 전달합니다.
- 401 응답 시 자동으로 `/login`으로 리다이렉트합니다.
- 페이지네이션 응답 타입: `PageResponse<T> = { items, page, size, totalElements, totalPages }`
- LLM 스트리밍: `executeCallStream()` 함수 (Server-Sent Events 방식)

### API 모듈 (`lib/api/`)

| 파일 | 담당 도메인 |
|------|-------------|
| `client.ts` | 공통 fetch 유틸, 에러 핸들링, 타입 |
| `workspaces.ts` | 워크스페이스 CRUD, 기본 옵션 |
| `prompts.ts` | 프롬프트 CRUD, Refs(브랜치/태그), Additional Inputs |
| `settings.ts` | LLM Vendor, Model, API Key CRUD |
| `llmCalls.ts` | LLM 실행(동기/스트리밍), 실행 로그 조회/취소 |

---

## 인증

- **Google OAuth**만 지원합니다.
- `@mystix.ai` 도메인 계정만 로그인 허용 (`auth.ts`의 `signIn` 콜백 참조).
- 로그인 페이지: `/login`
- 미인증 상태에서 `/`(루트)는 접근 허용, 나머지 경로는 인증 필요.

---

## 디렉토리 구조

```
mostprompt-web/
├── app/
│   ├── (settings)/              # 전역 설정 라우트 그룹
│   ├── (workspaces)/
│   │   └── workspaces/[workspaceId]/
│   │       ├── layout.tsx       # 워크스페이스 레이아웃 (사이드바 등)
│   │       ├── prompts/         # 프롬프트 목록, 상세, 편집
│   │       ├── playground/      # LLM 실행 테스트
│   │       ├── logs/            # LLM 호출 로그
│   │       └── settings/        # 워크스페이스 설정
│   │           ├── workspace/   # 기본 정보, 기본 옵션
│   │           ├── api-keys/    # LLM API 키 관리
│   │           ├── models/      # LLM 모델 관리
│   │           └── vendors/     # LLM 벤더 관리
│   ├── api/                     # Next.js API Routes
│   ├── login/                   # 로그인 페이지
│   ├── page.tsx                 # 루트 랜딩 페이지
│   ├── layout.tsx               # 전역 레이아웃 (Mantine provider 등)
│   ├── providers.tsx            # QueryClient, MantineProvider 등
│   └── theme.ts                 # Mantine 테마 설정
├── components/
│   ├── layout/                  # AppShellNav, SettingsNav, HeaderActions 등
│   ├── playground/              # ModelSelector 등 Playground 전용 컴포넌트
│   ├── prompts/                 # 프롬프트 관련 컴포넌트
│   └── logs/                   # 로그 관련 컴포넌트
├── config/
│   └── app-config.tsx           # SERVER_PHASE, API Base URL 결정 로직
├── lib/
│   ├── api/                     # API 호출 함수 모음
│   └── query/                   # TanStack Query keys
├── types/                       # 전역 TypeScript 타입 정의
├── auth.ts                      # next-auth 설정
├── middleware.ts                # 인증 미들웨어
└── .env.local                   # 로컬 환경변수 (gitignore)
```

---

## 주요 데이터 모델

### Workspace
```typescript
{ id: string; name: string; description?: string; defaultModelId?: number }
```

### Prompt / PromptRef
- `Prompt`: 프롬프트 메타정보
- `PromptRef`: 브랜치 또는 태그 (type: `"BRANCH" | "TAG"`)
- `AdditionalInputItem`: ref에 연결된 추가 입력 항목 (role: `USER | ASSISTANT | SYSTEM | DEVELOPER`)

### Vendor / Model / ApiKey
- LLM 벤더, 모델(`modelType: STANDARD | REASONING | UNKNOWN`), API 키

### CallLog / CallLogDetail
- LLM 호출 로그 (`status: PENDING | RUNNING | SUCCESS | ERROR | TIMEOUT | CANCELLED`)
- 스트리밍 이벤트 타입: `LlmStreamEvent` (response.created, response.message.delta 등)

---

## 개발 명령어

```bash
# 개발 서버 시작 (Next.js 16, localhost:3000)
pnpm run dev

# 빌드
pnpm run build

# 린트
pnpm run lint
```

---

## URL 상태 유지 원칙

**브라우저 주소창의 URL을 복사해 새 탭에서 열거나 새로고침을 해도, 동일한 화면 상태가 복원되어야 합니다.**

- 편집 화면에서 작성 중인 폼 내용 등 임시 상태는 예외입니다.
- 사용자의 액션으로 초기 상태와 달라질 수 있는 모든 UI 상태는 URL query parameter에 반영합니다.
  - 예: 선택된 탭, 필터/검색 조건, 선택된 모델·API 키 등
- 상태가 변경될 때마다 `router.replace()`로 URL을 갱신합니다 (`router.push()`는 히스토리가 쌓이므로 사용하지 않음).
- 페이지 마운트 시 URL query parameter를 읽어 초기 상태로 설정합니다.

**구현 패턴 (Next.js App Router Client Component):**

```tsx
const searchParams = useSearchParams();
const pathname = usePathname();
const router = useRouter();

const [selectedId, setSelectedId] = React.useState(searchParams.get("id") ?? "");

// 상태 → URL 동기화
React.useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedId) {
        params.set("id", selectedId);
    } else {
        params.delete("id");
    }
    if (params.toString() !== searchParams.toString()) {
        router.replace(`${pathname}?${params.toString()}`);
    }
}, [selectedId, pathname, router, searchParams]);
```

---

## 코딩 컨벤션

- **API 호출**: 반드시 `lib/api/` 내의 함수를 사용하고, `apiFetch`를 직접 호출하지 않습니다.
- **새 API 엔드포인트 연동**: API 스펙은 `http://localhost:8080/api-docs` 또는 Swagger UI에서 확인합니다.
- **데이터 패칭**: TanStack Query (`useQuery`, `useMutation`)를 사용합니다. Query key는 `lib/query/keys.ts`에서 관리합니다.
- **UI 컴포넌트**: Mantine v8 컴포넌트를 우선 사용합니다. 아이콘은 `@tabler/icons-react`를 사용합니다.
- **에러/알림**: `@mantine/notifications`의 `showNotification()`을 사용합니다.
- **모달**: `@mantine/modals`를 사용합니다.
- **경로 alias**: `@/`는 프로젝트 루트를 가리킵니다 (`tsconfig.json` 참조).
- **Server vs Client**: Next.js App Router의 Server Component / Client Component 구분을 준수합니다. 인터랙티브 컴포넌트는 `"use client"`를 선언합니다.
