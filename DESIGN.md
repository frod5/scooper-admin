# Scooper Admin — UI 디자인 스펙

구현 에이전트는 이 문서를 따른다. 색·타이포·컴포넌트 이름을 다시 정하지 않는다.
출근/퇴근 기록 UI는 없다.

**레퍼런스 (구현 기준)**
- Deputy 모바일: 인디고 `#5B4DFF`, 주간 날짜 스트립, 회색 날짜 바, TODAY, 당일 근무 리스트, FAB `+`, 지점 필터. [직원 가이드](https://help.deputy.com/hc/en-au/articles/4753097048719-Employee-guide-to-the-Deputy-mobile-app)
- Google Calendar: 월 그리드는 날짜 점프용으로만 (회색 바를 탭하면 펼침)
- 7shifts: 근무 카드에서 시간이 1순위

**폐기:** 종이 근무표 헤더, `/admin` 사이드바, 배정 전용 탭, 샌드/틸 수제 팔레트, 직원 탭 라벨 `나`.

제품 기능(전화 로그인, 역할, 지점, 직원 발급, 일정, 변경 요청, 공지, PWA/푸시)은 PLAN.md와 같다.

**유지:** 구글 캘린더 **구조** — 월 그리드 + 아래 아젠다, `/admin`에서 보기+배정+요청 한 화면, 관리 탭 4개.

---

## 1. 제품과 원칙

**한 줄:** 전화번호로 로그인하는 다지점 근무일정 PWA. 매장 스케줄 보드처럼 따뜻하고, 홈 화면에 올린 모바일 웹이 앱처럼 보인다.

**모바일 웹이 기본**

| 영역 | 기준 | 원칙 |
|---|---|---|
| 모든 화면 | 360–430px 폰 | 한 손. 하단 탭 + safe-area. 네이티브 앱처럼 |
| 데스크톱 | 같은 레이아웃을 가운데 `max-width: 520px` | 바깥은 `--color-bg`. 좌측 사이드바 없음 |

- `/login`, `/app`, `/admin/*` 모두 **같은 폰 컬럼**. 관리자만 넓은 대시보드를 만들지 않는다.
- 데스크톱 `max-width: 520px` (허용 480–560). 컬럼 밖 클릭 영역 없음.
- 헤더는 **얇고 밝다**. 아이보리/흰 상단. 큰 남색·틸 필 바 금지.
- 모달은 폰 `BottomSheet`. 데스크톱도 같은 시트(컬럼 안에서 올라옴).
- 출근/퇴근 버튼, 출석 배지, 타임카드 UI 없음.

**레퍼런스**

- **구조:** Google Calendar 모바일 (월 그리드 + 아래 아젠다, 오늘 점, 이벤트 칩). 구조만. 구글 블루·쿨그레이 톤은 쓰지 않는다.
- **톤:** When I Work / Homebase / 7shifts — 따뜻한 샌드 배경, 틸 액센트, 컬러 근무 카드, 부드러운 라운드. 교대근무 캘린더처럼 월 한눈에 색 칩.
- 과한 글래스·네온·그라데이션·노란 크림 SaaS 금지. 포인트 컬러는 **틸 하나**. 코랄은 칩·경고 틴트에만.

삭막한 흰 캔버스 + hairline만으로 화면을 나누지 않는다. 본문은 샌드 배경 위에 **아이보리 카드**와 여백으로 숨을 만든다.

---

## 2. 토큰

### 2.1 색 (hex)

구글 블루 `#2F6FED` 및 쿨그레이 `#F4F6F8` **사용 금지.**

```
--color-bg:            #F3EEE6
--color-surface:       #FFFCF8
--color-surface-2:     #F7F1E8
--color-ink:           #2C241C
--color-ink-2:         #4A4036
--color-muted:         #8A7E72
--color-line:          #E6DDD2
--color-hairline:      rgba(44, 36, 28, 0.08)

--color-accent:        #1A7A6D
--color-accent-press:  #14665B
--color-accent-soft:   #E4F3EF

--color-sunday:        #C45C4A
--color-saturday:      #1A7A6D

--color-ok:            #3B8B5C
--color-ok-soft:       #E8F4EC
--color-warn:          #C47A2A
--color-warn-soft:     #F8EEDC
--color-danger:        #C45C4A
--color-danger-soft:   #F8E8E4
--color-off:           #8A7E72
--color-off-soft:      #F0EBE4

--color-overlay:       rgba(44, 36, 28, 0.40)
--color-focus:         #1A7A6D
```

| 토큰 | 용도 |
|---|---|
| `--color-accent` | 오늘 날짜 원, 활성 탭, Primary 버튼, FAB, 선택 아웃라인, 링크. **틸.** |
| `--color-accent-soft` | 내 근무 칩, 선택 칩, 배너 배경 |
| `--color-bg` | 앱 배경. 따뜻한 샌드. 노란 크림·쿨그레이 아님 |
| `--color-surface` | 헤더, 탭바, 시트, 시프트 카드, 캘린더 그리드 면 |
| `--color-surface-2` | 입력 필드, 비선택 칩, 보조 면 |
| `--color-hairline` | 그리드 칸 구분 정도만. 화면 전체를 hairline으로 쪼개지 말 것 |
| `--color-sunday` | 일요일 **날짜 숫자만** (따뜻한 코랄) |
| `--color-saturday` | 토요일 **날짜 숫자만** (틸) |

상태 뱃지는 소프트 배경 + 컬러 글자. 원색 필 뱃지 남발 금지.

**이벤트 칩 틴트** (따뜻한 매장 보드. 원색·구글 블루 금지)

`userId` 해시 `% 6`. 내 근무는 틴트 대신 accent-soft + accent 글자.

```
--chip-0-bg: #DCEEEA    --chip-0-fg: #14665B
--chip-1-bg: #F3E4D8    --chip-1-fg: #A65B18
--chip-2-bg: #F6DDD6    --chip-2-fg: #C45C4A
--chip-3-bg: #E5EEDC    --chip-3-fg: #4D7C3F
--chip-4-bg: #EDE4F2    --chip-4-fg: #7C5C9C
--chip-5-bg: #F7E9C9    --chip-5-fg: #9A6700
```

셀·아젠다·변경요청 행에서 같은 사람 = 같은 틴트.

### 2.2 타이포

**Pretendard** (`Pretendard Variable` → `Apple SD Gothic Neo` → `Noto Sans KR` → system-ui).
Inter / Roboto / Geist 금지. 시간·날짜는 `font-variant-numeric: tabular-nums`.

```
--font-sans: "Pretendard", "Pretendard Variable", "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif

--text-11: 11px / 14px    500     칩, 뱃지, 탭 라벨, +N
--text-13: 13px / 18px    500     헬퍼, 2줄, 시간
--text-15: 15px / 22px    500     본문, 입력, 아젠다 이름
--text-17: 17px / 24px    600     버튼, 리스트 제목
--text-22: 22px / 28px    700     화면 제목 (월 이름)
--text-28: 28px / 34px    700     로그인 워드마크
```

- 월 제목: `--text-22` / `--color-ink`. 헤더에서 가장 크다.
- 본문: `--text-15` / `--color-ink`
- 보조: `--text-13` / `--color-muted`
- 셀 날짜 숫자: 12px / 600
- 칩 이름: 11px / 600, 1줄 말줄임

### 2.3 간격 · 라운드 · 그림자

```
--space-4:    4px
--space-8:    8px
--space-12:   12px
--space-16:   16px
--space-20:   20px
--space-24:   24px
--space-32:   32px

--radius-8:   8px      칩, 작은 뱃지
--radius-12:  12px     입력, 작은 카드
--radius-16:  16px     시프트 카드, 배너, 바텀시트 상단
--radius-pill: 999px   Primary CTA, FAB, 오늘 버튼, 필터 칩

--shadow-card:  0 1px 3px rgba(44, 36, 28, 0.06), 0 1px 2px rgba(44, 36, 28, 0.04)
--shadow-sheet: 0 -8px 28px rgba(44, 36, 28, 0.10)

--tap:        44px
--header-h:   52px
--tabbar-h:   52px
--fab-size:   52px
--hairline:   1px
```

- **시프트 카드·아젠다 행·변경요청 행·직원/지점 리스트 카드:** `--shadow-card` + `--radius-16` + `--color-surface`. 샌드 배경 위에 뜬다.
- 캘린더 그리드는 surface 한 장 카드(radius 16, 약한 그림자). 칸 사이만 hairline.
- 시트만 `--shadow-sheet`. 글로우·글래스 없음.
- 페이지 좌우 패딩 16px. 섹션 간격 16–20. 카드 사이 12.
- 버튼: **pill** 또는 `--radius-12`. 높이 48 (주요), 36 (칩/보조).

### 2.4 Tailwind 매핑

`globals.css` `@theme`에 위 CSS 변수를 등록. 컴포넌트에 hex 하드코딩 금지. `#2F6FED` 금지.

```
bg-bg            --color-bg
bg-surface       --color-surface
bg-surface-2     --color-surface-2
text-ink         --color-ink
text-muted       --color-muted
border-line      --color-line
bg-accent        --color-accent
text-accent      --color-accent
shadow-card      --shadow-card
rounded-16       16px
rounded-pill     999px
```

---

## 3. 공통 컴포넌트

`src/components/ui/` 등. 이름은 파일명으로 그대로.

| 이름 | 용도 |
|---|---|
| `PageShell` | 샌드 컬럼. 헤더 + 본문 + 탭바. `padding-bottom: tabbar + safe-area` |
| `AppHeader` | 높이 52 + `safe-area-inset-top`. **아이보리(`surface`)**. 하단 hairline 없음. 본문과 여백으로 구분 |
| `TabBar` | 하단 52 + `safe-area-inset-bottom`. surface 면, 상단 아주 약한 그림자. 아이콘 24 + 라벨 11 |
| `PrimaryButton` | 높이 48, pill, accent 필, 흰 글자 17/600. press: accent-press |
| `SecondaryButton` | 높이 48, pill, surface, accent 글자, 1px line |
| `GhostButton` | 높이 44, 배경 없음, ink 또는 accent |
| `DangerButton` | 높이 48, pill, danger-soft + danger 글자 (필 빨강 남발 금지) |
| `TextField` | 라벨 13 muted, 입력 48, radius 12, bg surface-2 (보더 없음). focus: 2px accent |
| `PasswordField` | TextField + 보기/숨기기 |
| `PhoneField` | 숫자만. 표시 `010-1234-5678` |
| `SelectField` | TextField와 같은 면. 시트 옵션 |
| `SearchField` | 높이 40, radius pill, bg surface-2, 좌측 돋보기 |
| `StatusBadge` | 11/600, padding 2×8, radius 8. 아래 변형만 |
| `EmptyState` | 짧은 문장 + 선택 버튼. 일러스트 없음 |
| `ErrorBanner` | 본문 상단 카드. danger-soft, radius 16, 13 danger |
| `LoadingBlock` | 샌드 톤 막대 3–6. 단독 스피너 남발 금지 |
| `Spinner` | 20px accent 원. 버튼 로딩 |
| `BottomSheet` | 오버레이 + 하단 패널 radius 16, surface, 핸들 36×4 `#D9D0C4` |
| `ConfirmSheet` | 제목 + 본문 + 취소/확인. 파괴는 DangerButton |
| `ListRow` | 최소 56. **카드형:** surface + radius 16 + shadow-card. 행 사이 12 갭 (hairline 스택 금지) |
| `FilterChips` | 가로 스크롤. 높이 32, pill. 선택: accent 필 흰 글자. 비선택: surface-2 + muted |
| `MonthSwitcher` | 좌 `‹` `›` 44 탭. 가운데 `2026년 9월` 22/700 |
| `TodayButton` | 헤더 우측. 높이 32 pill, surface-2, 13/600 `오늘` |
| `FAB` | 52 원, accent 필, 흰 `+`. 탭바 위 16, 우측 16 |
| `InstallBanner` | 캘린더 최상단 카드, radius 16, accent-soft, shadow-card |
| `PushPrompt` | InstallBanner 아래, 같은 면 |
| `NoticeToast` | 탭바 위 8. ink 90% 흰 글자, pill, 3초 |
| `ShiftCard` | 아젠다·변경요청 근무 한 줄. surface, radius 16, shadow-card, 패딩 12×16 |

### StatusBadge

| variant | 배경 | 글자 | 라벨 |
|---|---|---|---|
| `active` | ok-soft | ok | 근무중 |
| `resigned` | off-soft | off | 퇴사 |
| `pending` | warn-soft | warn | 대기 |
| `approved` | ok-soft | ok | 승인 |
| `rejected` | danger-soft | danger | 거절 |
| `mine` | accent-soft | accent | 나 |
| `count` | accent-soft | accent | `3` |

### TabBar 규칙

```
┌────────────────────────────────┐
│ ░ 약한 상단 그림자             │
│  [아이콘] [아이콘] [아이콘] …  │  아이콘 24, 활성=accent / 비활성=muted
│  [라벨]   [라벨]   [라벨]      │  11/600
│  ==== safe-area-inset-bottom ==│
└────────────────────────────────┘
```

- 활성: 아이콘·라벨 accent. 아이콘 아래 **2×12 pill 인디케이터** (accent 틸).
- 비활성: muted. 인디케이터 없음.
- 아이콘: Lucide 스트로크 2. 듀오톤·장식 금지.
- 관리 대기 건수: **일정** 탭 아이콘 우상 8px 원, danger 필, 흰 10/700. `9+`.
- 직원 내 대기 요청: **변경요청** 탭 아이콘 우상 같은 점.

### AppHeader 규칙

아이보리(`--color-surface`). 좌측 `MonthSwitcher` 또는 화면 제목 22/700. 우측 `TodayButton` / 텍스트 액션(accent 15/600).
**배경 accent 금지. 흰 글자 헤더 금지. 하단 hairline으로 화면을 자르지 말 것.** 헤더와 본문 사이 8–12 여백.

---

## 4. 역할별 내비게이션

로그인 후: 직원 → `/app`. 대표·시스템관리자 → `/admin`.
직원 `/admin/*` → `ForbiddenPage`. 대표·시스템관리자 `/app` → `/admin`.

`/admin/schedules`는 **만들지 않는다.** 북마크가 있으면 `/admin`으로 리다이렉트.

### 4.1 직원 — `/app` · 탭 3 (필수)

| 탭 | 라벨 | 경로 | 아이콘 |
|---|---|---|---|
| 일정 | 일정 | `/app` | Calendar |
| 변경요청 | 변경요청 | `/app/requests` | Clock |
| 설정 | 설정 | `/app/me` | Settings |

라벨 `나` **폐기.** 세 번째 탭은 반드시 **설정**.
변경요청 라벨은 4글자. 탭에 `변경`만 쓰지 말 것.
헤더 우측 지점명 13 muted는 **일정** 탭만.

### 4.2 대표 · 시스템관리자 — `/admin` · 탭 4

| 탭 | 라벨 | 경로 | 아이콘 |
|---|---|---|---|
| 캘린더 | 일정 | `/admin` | Calendar |
| 직원 | 직원 | `/admin/employees` | Users |
| 지점 | 지점 | `/admin/branches` | Building2 |
| 공지 | 공지 | `/admin/notices` | Megaphone |

메뉴 항목은 대표·시스템관리자 **같다**. 권한 차이는 화면 안 액션(대표 발급 등)만.
로그아웃: 일정 헤더 우측 `TodayButton` 왼쪽 `MoreSheet` — 이름, 역할, 로그아웃. (직원 설정 탭이 없음)

사이드바 컴포넌트 `AdminSidebar` **삭제. 구현하지 말 것.**

---

## 5. 캘린더 (핵심) — 구글 캘린더 구조 + 따뜻한 보드

직원 `/app`과 관리 `/admin`이 **같은** `CalendarMonth` + `AgendaList`.
차이: 관리만 배정 편집·FAB·변경 요청 처리. 직원은 변경 가능 날에만 요청.

`/admin` 한 화면 = 보기 + 배정 + 변경 요청. 별도 배정 탭 없음.

### 5.1 폰 와이어프레임 (`CalendarPage`)

```
┌────────────────────────────────┐
│ [safe-area]                    │
│  ‹   2026년 9월   ›      오늘  │  AppHeader 아이보리, 월 22/700
│                                │  여백 12
│ ┌ 설치/알림 카드            ┐  │  radius 16, accent-soft
│ └───────────────────────────┘  │
│ [전체] [강남점] [홍대점]   →   │  FilterChips  (/admin만)
│ ┌ 대기 2건            처리 →┐  │  PendingBar 카드 (/admin, 대기>0)
│ └───────────────────────────┘  │
│ ┌───────────────────────────┐  │
│ │ 일 월 화 수 목 금 토     │  │  CalendarMonth 한 장 카드
│ │ ┌──┬──┬──┬──┬──┬──┬──┐  │  │
│ │ │  │  │1 │2 │3 │4 │5 │  │  │
│ │ │  │  │김│나│  │박│최│  │  │  EventChip × ≤3
│ │ │  │  │이│  │  │  │+1│  │  │
│ │ └──┴──┴──┴──┴──┴──┴──┘  │  │
│ └───────────────────────────┘  │
│                                │
│ 9월 5일 금요일                 │  AgendaHeader 17/700 (카드 밖)
│ 3명 근무                       │  13 muted
│ ┌ 09:00–18:00               ┐  │  ShiftCard
│ │ ● 김수진               나 │  │
│ └───────────────────────────┘  │
│ ┌ 09:00–18:00               ┐  │
│ │ ● 이하늘                  │  │
│ └───────────────────────────┘  │
│ ┌ 변경 요청 대기            ┐  │  /admin, 그 날만
│ │ 이하늘 09–18 → 10–19      │  │
│ │ [거절]            [승인]  │  │
│ └───────────────────────────┘  │
│ ┌ 이 날 변경 요청 ┐            │  직원, canRequest일 때만
│                      ( + )     │  FAB /admin만
│ [일정][변경요청][설정]         │  직원 TabBar
│ [일정][직원][지점][공지]       │  관리 TabBar
└────────────────────────────────┘
```

직원 `/app`은 지점 칩·PendingBar·FAB·승인버튼 없음. 헤더 우측 `오늘` + 지점명.

### 5.2 그리드 규칙 (`CalendarMonth`, `CalendarCell`)

1. 주 시작 **일요일**. 헤더 `일 월 화 수 목 금 토`.
2. 일 숫자 `--color-sunday`, 토 숫자 `--color-saturday`. 평일 ink. **약하게** (글자색만).
3. 이번 달 아닌 칸: 빈 칸. 탭 불가. 숫자·칩 없음.
4. 셀은 **낮고 넓다**. 높이: 폰 **56–64px** (6주여도 그리드가 화면 상단 ~48%를 넘지 않게). 아젠다가 아래를 차지.
5. 셀 패딩 2×3. 칸 보더 hairline. 둥근 셀 없음. 그리드 전체는 radius 16 카드.
6. **오늘**: 날짜 숫자에 **20px accent(틸) 원 + 흰 12/700**. 셀 배경 칠하지 않음.
7. **선택**: 날짜 숫자에 **20px 원 아웃라인** 1.5px accent (오늘과 겹치면 오늘 필이 이김, 셀 하단에 2px accent 바).
8. 그리드 아래 아젠다는 별도 카드들. 그리드와 아젠다 사이 16 여백.

### 5.3 셀 칩 규칙 (`EventChip`)

셀 안에 근무는 **컬러 칩** (이름 한 줄). 시간 넣지 않음. 시간은 아젠다.

```
[김수진]     radius 6, 높이 14–16, 11/600, 좌우 4
이름 말줄임. 배경 따뜻한 틴트, 글자 틴트-fg.
```

| 규칙 | 내용 |
|---|---|
| 최대 | 이름 칩 **3개**. 4명 이상이면 3 + `+N` (11 muted) |
| 정렬 | 시작 시간 → 이름. 직원 뷰에서 **나**는 맨 위 |
| 나 | accent-soft / accent. 왼쪽에 2px accent 바 가능 |
| 빈 날 | 숫자만. `0명` 문구 없음 |
| 대기 | 그 날 내(직원) 또는 지점(관리) 대기 요청 있으면 셀 우상 **6px warn 점** |

관리자 필터 `전체`: 칩에 이름만 (지점명은 아젠다). 관리·직원 모두 이름 칩.

### 5.4 선택 날 아젠다 (`AgendaList`, `AgendaRow` = `ShiftCard`)

그리드 **아래**가 상세. 날짜 탭 = 선택만 바꾸고 시트 전체 화면을 열지 않음.

**AgendaHeader** (카드 밖, 샌드 위)

- `9월 5일 금요일` 17/700
- `3명 근무` 13 muted
- 0명: `배정된 근무가 없습니다.`

**ShiftCard / AgendaRow**

```
┌────────────────────────────────┐
│ 09:00 – 18:00          9시간   │  13 muted tabular
│  ● 김수진                  나  │  15/600, ● = 틴트 8px 원
└────────────────────────────────┘
```

surface, radius 16, shadow-card, 패딩 12×16, 카드 갭 12. 높이 최소 64.

- 직원 **나** 행: §5.6 `canRequest`이면 우측 또는 하단 `[변경 요청]` 36 pill. 불가하면 버튼 숨김(비활성 고스트로 남기지 말 것). 불가 사유는 그 날 아젠다 헤더 아래 13 muted 한 줄.
- 직원 타인 행: 탭해도 요청 폼 없음.
- 관리: 탭 → `ShiftSheet` (시간 수정 / 삭제).

**관리 아젠다 빈 날**

```
배정된 근무가 없습니다.
[+ 근무 추가]     Secondary pill 또는 FAB
```

### 5.5 근무 추가·수정 (`ShiftSheet`, `FAB`)

관리자만. FAB는 선택한 날짜에 추가.

`ShiftSheet`

```
┌────────────────────────────────┐
│ ────                           │
│ 근무 추가 · 9월 5일            │  또는 근무 수정
│ 강남점                         │
│                                │
│ 직원                           │
│ ┌ 이하늘                   ▾ ┐ │  이 지점 근무중, 그 날 미배정
│ 시작                           │
│ ┌ 09:00                      ┐ │  native time
│ 종료                           │
│ ┌ 18:00                      ┐ │
│                                │
│ [삭제]              [저장]     │  수정일 때만 삭제
└────────────────────────────────┘
```

- 추가 기본 시간 09:00–18:00.
- 종료 ≤ 시작: `종료 시간은 시작 이후여야 합니다.`
- 같은 사람 같은 날 중복 불가.
- 지점 필터 `전체`인 채로 FAB: 시트 맨 위 지점 Select 필수.
- 삭제 ConfirmSheet: `이 날 배정에서 빼면 직원 일정에서 사라집니다.`
- 퇴사자는 추가 목록에 없음. 이미 배정된 퇴사 행은 muted + `퇴사`, 삭제만.

FAB: `/admin` 캘린더 탭에서만. 빈 아젠다에는 `+ 근무 추가` 텍스트 버튼도.

### 5.6 변경 요청 가능 여부 (`canRequest`)

직원만. **캘린더 아젠다와 `/app/requests`가 같은 함수를 쓴다.** 시간대 Asia/Seoul.

| 조건 | 결과 | 카피 (버튼 숨기고 이 문장) |
|---|---|---|
| 내 근무가 아님 | 불가 | 버튼 없음. 문구 없음 |
| `work_date` < 오늘 | 불가 | `지난 근무는 변경할 수 없습니다.` |
| 오늘이고 현재 시각 ≥ `start_time` | 불가 | `이미 시작된 근무는 변경할 수 없습니다.` |
| 해당 날 pending 요청 있음 | 불가 (추가) | 요약 + `StatusBadge pending`. `대기 중인 요청이 있습니다.` |
| 그 외 (미래, 또는 오늘·시작 전) | **가능** | `[변경 요청]` |

오늘 0시 이전이라도 시작 시각이 아직이면 가능. 자정 넘긴 지난 날은 무조건 불가.

**직원 `ChangeRequestForm`** (시트) — 가능 날만 연다.

```
변경 요청 · 9월 5일
현재  09:00 – 18:00
시작 시간 / 종료 시간 / 사유(선택)
[취소]  [요청 보내기]
```

- 카피: **시작 시간 / 종료 시간**. `출근` `퇴근` 금지.
- 성공 토스트 `변경 요청을 보냈습니다.`
- 아젠다에서 불가한 날의 내 행을 탭해도 폼을 열지 않음.

**관리 `PendingBar` + `ChangeRequestCard`**

- 상단 카드 `대기 N`. 탭 → 아젠다 스크롤 또는 `PendingListSheet` (3건 넘으면 시트).
- 선택한 날 대기는 아젠다 아래 `ChangeRequestCard` (ShiftCard와 같은 면).

```
┌────────────────────────────────┐
│ 이하늘 · 대기                  │  StatusBadge pending
│ 09:00–18:00 → 10:00–19:00      │
│ 병원                           │
│ [거절]              [승인]     │  Ghost / Primary 높이 36 pill
└────────────────────────────────┘
```

- 승인·거절 즉시. 토스트 `승인했습니다.` / `거절했습니다.`
- 승인 시 그 날 시간이 요청 값으로 교체. 처리됨은 기본 숨김.

### 5.7 지점 필터 (`FilterChips` on `/admin`)

캘린더 상단. **조회와 배정이 같은 필터.**

- 칩: `전체` + 지점명 가나다. 기본 `전체`.
- `전체`: 모든 지점 칩·아젠다. 아젠다 행 2줄에 지점명 13 muted.
- 단일 지점: 그 지점만 배정·요청.
- 지점 0개: 그리드 숨김, `EmptyState` `지점을 먼저 추가하세요.` + `지점 추가`.

직원은 자기 지점 고정. 칩 없음.

### 5.8 캘린더 상태

| 상태 | UI |
|---|---|
| 로딩 | 그리드 스켈레톤 카드 + 아젠다 카드 3 |
| 에러 | ErrorBanner `일정을 불러오지 못했습니다.` + 다시 시도 |
| 빈 월 | 그리드는 있고 칩 없음. 아젠다 Empty |
| 권한 | ForbiddenPage |

`TodayButton`: 이번 달이면 오늘 셀 선택 + 아젠다 오늘. 다른 달이면 이번 달로 이동 후 오늘 선택.

---

## 6. 나머지 화면 (같은 따뜻한 모바일 톤)

공통: 아이보리 헤더 22 제목, 샌드 본문, 카드+여백, 하단 탭, radius 12 입력, pill 버튼.

### 6.1 `/login` — LoginPage

컬럼 중앙, 상단 여백 96. 입력은 surface 카드 한 장 안에 넣어도 된다.

```
┌────────────────────────────────┐
│                                │
│  SCOOPER                       │  28/700 ink
│  전화번호로 로그인             │  15 muted
│                                │
│  ┌ 카드                     ┐  │  surface, radius 16, shadow-card
│  │ 전화번호                 │  │
│  │ ┌──────────────────────┐ │  │  TextField surface-2
│  │ │ 010-1234-5678        │ │  │
│  │ └──────────────────────┘ │  │
│  │ 비밀번호                 │  │
│  │ ┌──────────────────────┐ │  │
│  │ │ ••••              보기│ │  │
│  │ └──────────────────────┘ │  │
│  │ ┌──────────────────────┐ │  │
│  │ │       로그인         │ │  │  Primary pill 틸
│  │ └──────────────────────┘ │  │
│  └──────────────────────────┘  │
│  계정은 대표가 발급합니다      │  13 muted
└────────────────────────────────┘
```

가입/소셜 없음. 퇴사 계정: `퇴사한 계정입니다. 관리자에게 문의하세요.`

### 6.2 `/app/requests` — EmployeeRequestsPage (신규)

직원 탭 **변경요청**. 앞으로의 내 근무만 기본 노출.

```
┌────────────────────────────────┐
│ 변경 요청                      │  22/700
│ 바꿀 수 있는 근무만 보여 줍니다│  13 muted
│                                │
│ 이번 주                        │  13/600 muted
│ ┌ 9월 8일 월                 ┐  │  ShiftCard
│ │ 09:00–18:00                │  │
│ │              [변경 요청]   │  │  canRequest
│ └───────────────────────────┘  │
│ ┌ 9월 10일 수            대기┐  │
│ │ 09:00–18:00 → 10:00–19:00  │  │  pending 요약
│ │ 병원                       │  │  버튼 없음
│ └───────────────────────────┘  │
│                                │
│ 다음 주 …                      │
└────────────────────────────────┘
```

- 기본 목록: `work_date > 오늘` 이거나 (`work_date == 오늘` && 현재 < start_time). **지난 날 섹션을 기본으로 펼치지 않음.**
- 지난 근무를 보고 싶으면 하단 텍스트 `지난 근무 보기` (접힘). 열면 카드는 muted, 버튼 없음, 캡션 `지난 근무는 변경할 수 없습니다.`
- 오늘·이미 시작: 기본 목록에 넣지 않음. `지난 근무 보기`에 포함, 캡션 `이미 시작된 근무는 변경할 수 없습니다.`
- 가능 날: 날짜(17/600) · 현재 시간 13 muted · `[변경 요청]` → 같은 `ChangeRequestForm`.
- 대기: 뱃지 + 현재→요청 시간 + 사유. 추가 요청 불가. 카드 탭해도 폼 없음.
- 빈: `EmptyState` `변경할 수 있는 근무가 없습니다.`
- 로딩: ShiftCard 스켈레톤 4. 에러: ErrorBanner.

### 6.3 `/app/me` — EmployeeProfilePage (라벨: 설정)

```
┌────────────────────────────────┐
│ 설정                           │  22/700  (`나` 금지)
│ ┌ 이름 / 전화 필드          ┐  │  카드
│ │ 지점  강남점   (읽기)     │  │
│ │ 상태  [근무중]            │  │
│ └───────────────────────────┘  │
│ ┌ 비밀번호 변경             ┐  │
│ │ 현재 / 새 비밀번호        │  │
│ │ [저장]                    │  │
│ └───────────────────────────┘  │
│ 로그아웃                       │  Ghost danger
└────────────────────────────────┘
```

로그아웃 ConfirmSheet. 지점·상태 수정 불가.

### 6.4 PWA · 알림

`InstallBanner` — standalone 아니고 7일 내 닫지 않음. **`/app` 일정만.**

```
┌────────────────────────────────┐
│ 홈 화면에 추가하면 앱처럼      │
│ 열 수 있어요.            닫기  │
│ [설치 방법 보기]               │  pill accent
└────────────────────────────────┘
```

iOS `InstallGuideSheet`: `공유(□↑) → 홈 화면에 추가 → 추가`.
Android `beforeinstallprompt`: 버튼 `홈 화면에 추가`.
닫기: `localStorage` `scooper.installBanner.dismissedAt` 7일.

`PushPrompt` — `/app` 일정, `/admin` 일정 상단.

- `default`: `근무 변경과 공지를 받으려면 알림이 필요해요.` `[알림 켜기]`
- `denied`: `전화 설정 → 이 사이트 → 알림`, warn-soft 카드.
- 닫기: sessionStorage.

### 6.5 `/admin/employees` — EmployeesPage

```
┌────────────────────────────────┐
│ 직원                    발급   │
│ ┌ 이름 또는 전화번호        ┐ │
│ [전체] [근무중] [퇴사]         │
│ [전체] [강남점] [홍대점]       │
│ ┌ 이하늘                    ┐  │  ListRow 카드
│ │ 010-1234-5678 · 강남점    │  │
│ │                    근무중 │  │
│ └───────────────────────────┘  │
└────────────────────────────────┘
```

행 탭 → `EmployeeDetailSheet`. 필터 기본 `근무중`.

**IssueEmployeeSheet** — 이름, 전화번호, 지점. **비밀번호 입력 없음.**

```
초기 비밀번호는 1234입니다.
직원에게 로그인 후 설정에서 바꾸라고 안내하세요.
```

accent-soft 박스, radius 16, 13 ink.

시스템관리자 발급: 세그먼트 `직원 | 대표`. 대표는 이름+전화, 지점 없음. 1234 안내 동일.

퇴사: 목록에 남김, 이름 muted, `StatusBadge resigned`. 일정·공지 대상 제외.

### 6.6 `/admin/branches` — BranchesPage

```
│ 지점                    추가   │
│ ┌ 강남점                 4명┐  │  카드
│ ┌ 홍대점                 3명┐  │
```

탭 → `BranchEditSheet` 이름 수정. **삭제 버튼 없음** (1차).
빈: `지점이 없습니다.` + 추가.

### 6.7 `/admin/notices` — NoticesPage

```
│ 공지                           │
│ ┌ 제목 / 내용 / 보낼 곳     ┐  │  작성 카드
│ │ ○ 전체  ○ 지점            │  │
│ │ 근무 중인 직원에게만 갑니다│  │
│ │ [작성하고 푸시 보내기]    │  │
│ └───────────────────────────┘  │
│ 보낸 공지                      │
│ ┌ 9월 5일 · 전체            ┐  │
│ │ 내일 오픈 1시간 앞당깁니다│  │
│ └───────────────────────────┘  │
```

ConfirmSheet 후 발송. 수정/재발송 없음. 푸시 실패와 저장 실패 카피 분리.

### 6.8 ForbiddenPage · 세션

- 세션 없음 → `/login`
- 권한 없음 → 제목 `접근 권한이 없습니다` + `돌아가기`
- 세션 로딩 → 중앙 Spinner + `불러오는 중`

---

## 7. 반응형 · PWA 크롬

```
html, body { background: var(--color-bg); }
.app-root { max-width: 520px; margin: 0 auto; min-height: 100dvh; background: var(--color-bg); }
```

| 폭 | |
|---|---|
| 360–430 | 정본. 컬럼 100% |
| 431–519 | 컬럼 100%, 여백 16 유지 |
| ≥ 520 | 컬럼 520 중앙. 탭바·헤더도 컬럼 안에 고정 (viewport 전체 폭 탭바 금지) |

```
--header-pad-top: env(safe-area-inset-top)
--tabbar-pad-bottom: env(safe-area-inset-bottom)
본문 padding-bottom: calc(var(--tabbar-h) + env(safe-area-inset-bottom) + 16px)
FAB bottom: calc(var(--tabbar-h) + env(safe-area-inset-bottom) + 16px)
```

manifest: `display: standalone`, `theme_color: #FFFCF8`, `background_color: #F3EEE6`.
상태바 아이콘은 어두운 글자 (밝은 헤더).

---

## 8. 카피

- 존댓말, 짧은 명사 제목: `일정`, `변경 요청`, `설정`, `직원`, `지점`, `공지`.
- 금지: 출근, 퇴근, 출석, 타임카드, 대시보드(제목), 탭 라벨 `나`.
- 버튼: `로그인`, `저장`, `발급`, `추가`, `승인`, `거절`, `변경 요청`, `요청 보내기`, `알림 켜기`, `오늘`.

---

## 9. 구현 체크리스트

1. `#2F6FED` · 쿨그레이 배경 없음. 샌드 `#F3EEE6` + 아이보리 `#FFFCF8` + 틸 `#1A7A6D`.
2. 남색/틸 풀폭 헤더 없음. 헤더는 아이보리, hairline으로 화면을 자르지 않음.
3. 시프트·목록은 카드 + `--shadow-card`. 삭막한 hairline 리스트 금지.
4. `AdminSidebar` 없음. 데스크톱도 중앙 520 폰 레이아웃.
5. `/admin/schedules` 없음. 배정은 `/admin` 캘린더.
6. 관리 탭 4개: 일정 / 직원 / 지점 / 공지.
7. 직원 탭 **3개:** 일정 `/app` · 변경요청 `/app/requests` · 설정 `/app/me`. `나` 라벨 없음.
8. 캘린더 = 낮은 월 그리드 카드 + 아래 아젠다 카드. 날짜 탭이 그리드를 대체하지 않음.
9. 셀 안 `EventChip` 따뜻한 틴트 ≤3 + `+N`.
10. 오늘 = 틸 원. 선택 = 아웃라인. 일=코랄 숫자, 토=틸 숫자.
11. 관리 FAB·아젠다에서 추가/수정/삭제.
12. 직원 변경 요청은 `canRequest`만. 지난 날·이미 시작·대기 중에는 버튼 숨김. 아젠다와 `/app/requests` 동일 규칙.
13. 대기 = 관리 `PendingBar` + `ChangeRequestCard`. 직원 변경요청 탭 뱃지.
14. 지점 필터 하나. 조회=배정.
15. 직원 발급: 이름·전화·지점, 비번 입력 없음, 1234 안내, 카피 `설정에서`.
16. 퇴사는 뱃지로 목록에 잔류.
17. radius 12–16. pill CTA. Pretendard. 글래스·네온·구글 블루 없음.
18. `/app`에 출근/퇴근 버튼 없음.
19. iOS 설치 = 공유 → 홈 화면에 추가.
20. 탭바 safe-area, 컬럼 안에 고정.
21. 컴포넌트 이름은 아래 PascalCase.

---

## 10. 컴포넌트 인덱스

```
src/components/ui/PageShell.tsx
src/components/ui/AppHeader.tsx
src/components/ui/TabBar.tsx
src/components/ui/PrimaryButton.tsx
src/components/ui/SecondaryButton.tsx
src/components/ui/GhostButton.tsx
src/components/ui/DangerButton.tsx
src/components/ui/TextField.tsx
src/components/ui/PasswordField.tsx
src/components/ui/PhoneField.tsx
src/components/ui/SelectField.tsx
src/components/ui/SearchField.tsx
src/components/ui/StatusBadge.tsx
src/components/ui/EmptyState.tsx
src/components/ui/ErrorBanner.tsx
src/components/ui/LoadingBlock.tsx
src/components/ui/Spinner.tsx
src/components/ui/BottomSheet.tsx
src/components/ui/ConfirmSheet.tsx
src/components/ui/ListRow.tsx
src/components/ui/FilterChips.tsx
src/components/ui/FAB.tsx
src/components/ui/NoticeToast.tsx
src/components/ui/MoreSheet.tsx
src/components/ui/ShiftCard.tsx

src/components/calendar/CalendarMonth.tsx
src/components/calendar/CalendarCell.tsx
src/components/calendar/EventChip.tsx
src/components/calendar/MonthSwitcher.tsx
src/components/calendar/TodayButton.tsx
src/components/calendar/AgendaList.tsx
src/components/calendar/AgendaHeader.tsx
src/components/calendar/AgendaRow.tsx
src/components/calendar/PendingBar.tsx
src/components/calendar/ChangeRequestCard.tsx
src/components/calendar/ChangeRequestForm.tsx
src/components/calendar/ShiftSheet.tsx
src/components/calendar/PendingListSheet.tsx
src/components/calendar/canRequest.ts      work_date + start_time + pending 규칙

src/components/pwa/InstallBanner.tsx
src/components/pwa/InstallGuideSheet.tsx
src/components/pwa/PushPrompt.tsx

src/components/employees/IssueEmployeeSheet.tsx
src/components/employees/IssueOwnerSheet.tsx
src/components/employees/EmployeeDetailSheet.tsx

src/components/branches/BranchEditSheet.tsx
src/components/notices/NoticeDetailSheet.tsx
src/components/profile/EmployeeProfileForm.tsx
src/components/requests/EmployeeRequestsList.tsx

src/app/login/page.tsx                 LoginPage
src/app/app/page.tsx                   CalendarPage (직원)
src/app/app/requests/page.tsx          EmployeeRequestsPage
src/app/app/me/page.tsx                EmployeeProfilePage  (설정)
src/app/admin/page.tsx                 CalendarPage (관리 = 보기+배정+요청)
src/app/admin/employees/page.tsx       EmployeesPage
src/app/admin/branches/page.tsx        BranchesPage
src/app/admin/notices/page.tsx         NoticesPage
src/app/forbidden/page.tsx             ForbiddenPage
```

`CalendarPage`는 역할 prop (`mode: "employee" | "admin"`) 하나로 공유한다.
`canRequest`는 아젠다와 변경요청 목록이 공유한다.
