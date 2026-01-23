# HANDOFF PACKET — mostPrompt Web MVP

Stack: Next.js(App Router) + TypeScript + Tailwind CSS + Mantine 8.x(최신버전) + React Query

# 0) 개발 시작 전에 사용자(동성 신)가 결정해야 하는 것
1.API Base URL
http://localhost:8080

- api spec: /api-docs
- swagger: /swagger-ui

2.Workspace 처리 방식
- root('/') 랜딩에서 GET /workspaces 호출 → 워크스페이스 선택
- 선택 시 '/workspaces/{workspaceId}/playground'로 이동

3.언어
- 옵션: UI 한국어/영어
- 기본값: 한국어(라벨만). 내부 키/코드에는 영향 없음.

위 4개는 "결정 없으면 기본값으로 진행" 가능. Codex는 구현 중 백엔드 코드를 보고 자동으로 맞추면 됨.

# 1) 핵심 원칙
- mostPrompt MVP의 프론트 목표는 3축 관통:
   1.Prompts(생성/목록/상세/스냅샷 생성)
   2.Playground(실행)
   3.Logs(목록/상세)
- Auth 없음(익명 사용자 1명), workspace 1개 가정.
- API Key는 절대 평문 재노출 금지: 입력은 "등록/수정 시에만", 이후에는 마스킹만 표시.

# 2) Mantine + Tailwind 결합 규칙(필수)
## 2.1 Mantine은 styles.layer.css로 import
Next.js는 스타일 import order가 보장되지 않을 수 있으므로 Mantine 문서가 CSS layers 사용을 권장함. 또한 styles.css와 styles.layer.css를 동시에 import 하면 안 됨.
- root에서 예:
   @mantine/core/styles.layer.css
   @mantine/dates/styles.layer.css 등

## 2.2 globals.css에서 layer 순서 고정
Tailwind base → mantine → tailwind utilities 순으로. Mantine 문서에도 layer order 예시가 있음.

app/globals.css
```css
@layer base, mantine, components, utilities;

@tailwind base;
@tailwind components;
@tailwind utilities;
```

## 2.3 Server Components 주의
Mantine 컴포넌트는 server component로 직접 쓰기 어렵고(내부적으로 useContext), 패키지 엔트리포인트가 'use client'인 구조임. 따라서 Provider/레이아웃 구성에 client boundary를 명확히 둔다.

# 3) 프로젝트 스캐폴딩 & 패키지
## 3.1 생성
- Next.js App Router + TS + Tailwind + ESLint

## 3.2 의존성(권장)
- @mantine/core @mantine/hooks
- @mantine/form (폼)
- @mantine/notifications (토스트)
- @mantine/modals (확인/생성 모달)
- @mantine/dates (로그 필터 기간)
- @mantine/code-highlight (output/options 표시)
- @tabler/icons-react
- @tanstack/react-query

# 4) 폴더 구조(권장)
```pgsql
app/
  layout.tsx
  providers.tsx
  globals.css

  (root)/
    page.tsx

  (workspaces)/
    workspaces/
      [workspaceId]/
        layout.tsx
        page.tsx
        prompts/
          page.tsx
          new/
            page.tsx
          [promptId]/
            page.tsx
        playground/
          page.tsx
        logs/
          page.tsx
          [callId]/
            page.tsx
        settings/
          api-keys/
            page.tsx
          models/
            page.tsx

  (settings)/
    settings/
      layout.tsx
      page.tsx
      workspaces/
        page.tsx
      vendors/
        page.tsx
      api-keys/
        page.tsx
      models/
        page.tsx
      prompts/
        page.tsx
      logs/
        page.tsx

lib/
  api/
    client.ts        # baseUrl, fetch wrapper, error normalize
    prompts.ts
    llmCalls.ts
    settings.ts
  query/
    keys.ts
    queryClient.ts

components/
  layout/
    AppShellNav.tsx
    HeaderActions.tsx
  prompts/
    PromptTable.tsx
    PromptEditor.tsx
    SnapshotTable.tsx
    RefTable.tsx
  playground/
    ExecutePanel.tsx
    OutputPanel.tsx
  logs/
    LogTable.tsx
    LogDetail.tsx

```

# 5) 레이아웃 구현 가이드
## 5.1 Root Layout: styles import + Providers
- app/layout.tsx에서 Mantine styles.layer.css import + globals.css import
- Providers는 client 컴포넌트로 분리: MantineProvider + ReactQuery + Notifications + Modals

## 5.2 Workspaces Layout: AppShell (워크스페이스용)
Mantine AppShell로 헤더/네비/메인 구성. AppShell은 header/navbar/aside/footer 레이아웃 패턴을 제공.
- 네비 메뉴:
  - Prompts
  - Playground
  - Logs
  - Settings(API Keys, Models)
- 헤더 우측: 기어 아이콘 → '/settings' 이동

## 5.3 Settings Layout: AppShell (전역 관리용)
전역 관리용 사이드바 제공. 메뉴:
- Workspaces
- Vendors
- API Keys
- Models
- Prompts
- Logs

# 6) 라우팅(IA) & 페이지별 요구사항
## 6.0 Root (Landing)
- '/'에서 워크스페이스 선택 Select 제공
- 선택 시 '/workspaces/{workspaceId}/playground' 이동

## 6.1 /prompts (목록)
경로: '/workspaces/{workspaceId}/prompts'
목표: Prompt 목록 + "새 Prompt 만들기" 버튼
- Mantine: Table, ScrollArea, TextInput(검색), Button
- 항목 표시: name, latestRef, updatedAt(가능하면)

## 6.2 /prompts/new (생성)
경로: '/workspaces/{workspaceId}/prompts/new'
목표: Prompt 생성 시 main branch + snapshot v1 생성 (백엔드 정책 그대로)
- 입력: prompt name, instructions(초기)
- 성공 시 /prompts/[promptId] 이동 + toast

## 6.3 /prompts/[promptId] (상세: Tabs 권장)
경로: '/workspaces/{workspaceId}/prompts/[promptId]'
Tabs: Editor / Snapshots / Refs
- Editor 탭:
  - instructions 편집 → "저장"은 새 snapshot 생성으로 동작(선형 버전)
- Snapshots 탭:
  - version desc 목록
  - "이 버전으로 Playground 실행" 버튼(Playground로 이동하며 snapshotId 전달)
- Refs 탭:
  - BRANCH/TAG 목록
  - 생성 모달
  - TAG는 immutable: UI에서 수정/이동 버튼 노출 금지
  - BRANCH 이동: target snapshot 선택 후 PATCH 호출

## 6.4 /playground
경로: '/workspaces/{workspaceId}/playground'
목표: ref/snapshot/raw 중 하나로 실행하고 output 표시 + callLogId 링크
- 실행 소스 선택: SegmentedControl(REF, SNAPSHOT, RAW)
- 모델/키 선택: vendor/model/apiKey select
- overrideOptions: JSON 입력(간단히 Textarea 가능) → 서버에 그대로 전달
- 실행 결과: outputText 표시 + "Logs 상세 이동" 링크

## 6.5 /logs, /logs/[callId]
경로: '/workspaces/{workspaceId}/logs', '/workspaces/{workspaceId}/logs/[callId]'
- 목록: 필터(promptId, modelId, status, from/to) + table
- 상세: InputItems/OutputItems/Resolved options/모델정보
  - output/options는 code highlight + CopyButton

## 6.6 /settings/api-keys, /settings/models
경로: '/workspaces/{workspaceId}/settings/api-keys', '/workspaces/{workspaceId}/settings/models'
- API Keys: 목록(마스킹) + 등록/수정(평문 입력은 여기서만)
- Models: vendor/modelKey 목록(메타 표시)

## 6.7 전역 Settings (관리용)
경로: '/settings/*'
- Workspaces, Vendors, API Keys, Models, Prompts, Logs 관리 메뉴

# 7) API 통합 지침(필수)
## 7.1 Base URL
- NEXT_PUBLIC_API_BASE_URL 환경변수 사용
- lib/api/client.ts에서 fetch wrapper 구현:
  - JSON parse
  - HTTP 에러를 { status, code?, message }로 normalize
  - 에러 메시지를 toast로 표시(Notifications)

## 7.2 Workspace 부팅 로직
- root('/')에서 GET /workspaces 후 사용자 선택
- '/workspaces/{workspaceId}/*'에서 라우트 param 기반으로 workspaceId 사용

## 7.3 React Query 키 설계
- workspaces, prompts(workspaceId), prompt(promptId), snapshots(promptId), refs(promptId)
- logs(workspaceId, filters), log(callId), models(workspaceId), apiKeys(workspaceId)

## 7.4 보안
- apiKey value는 응답 DTO에 포함되더라도 화면에서 마스킹 처리
- 콘솔 로그/에러에 key 값 출력 금지

# 8) UX/정책 강제(프론트에서 보조적으로)
- TAG 수정/이동 UI 제공 금지(immutable)
- "snapshot 저장"은 항상 새 version 생성
- vendor 일치 검증은 서버가 최종 책임이지만, 가능하면 UI에서 model/vendor와 key/vendor mismatch 시 경고 표시

# 9) 구현 순서(이대로 하면 막힘 적음)
1.스캐폴딩 + styles.layer + Providers 완성
2.루트 랜딩 + 워크스페이스 선택
3./workspaces/{id} AppShell + prompts/playground/logs
4./workspaces/{id}/settings(api keys, models)
5./settings (전역 관리) 확장

# 10) Definition of Done (완료 기준)
- Prompts:
  - 생성/목록/상세/새 snapshot 생성 동작
  - refs 탭에서 branch 생성/이동 가능, tag는 읽기전용
- Playground:
  - ref/snapshot/raw 중 하나로 실행 가능
  - output 표시 + callLogId로 logs 상세 이동
- Logs:
  - 목록 필터 + 상세에서 input/output/options 확인 가능
- Settings:
  - API key 등록/수정 가능(마스킹), 모델 목록 확인 가능
- Mantine+Tailwind:
  - styles.layer.css 사용, globals layer order 적용, 스타일 충돌 없음(기본 UI 깨짐 없어야 함)

# 11) Codex 작업 지시(실행용)
- 백엔드 코드/Swagger를 확인해서 실제 endpoint path/DTO에 맞춰 lib/api/*를 맞출 것.
- 먼저 "관통 시나리오(프롬프트 생성 → snapshot → playground 실행 → logs 확인)"가 되는 최소 UI를 만들고, 그 다음 Refs/Settings를 확장할 것.
- Mantine은 styles.layer.css만 사용하고 styles.css와 혼용 금지.
