# 10명 규모 근무일정 관리 (PWA + 푸시)

## 현재 상태

- 스택: Next.js 16 + Supabase + Vercel
- 프로젝트 위치: `/Users/sunwookim/workspace/scooper-admin`
- GitHub: https://github.com/frod5/scooper-admin.git
- 지금은 Next.js 빈 앱만 있음. 기능 구현은 아직 없음.
- 오케스트레이션: Herdr 워크스페이스 `스쿠퍼`

## 누가 뭘 하나

| 역할 | Herdr 탭 | 하는 일 |
|---|---|---|
| 오케스트레이터 | 스쿠퍼개발 오케스트레이션 | 계획, 위임, 검수, 합치기 |
| UI 디자인 | 스쿠퍼 ui디자인 | 화면 구조, 컴포넌트, 색/타이포, 모바일 레이아웃. `DESIGN.md` 작성 |
| 구현 | 스쿠퍼 어드민 개발 | 로그인, 계정, 일정, PWA/푸시. `DESIGN.md`를 따름 |

디자인 스펙이 나온 뒤에만 구현을 시작. 구현 에이전트는 디자인 방향을 다시 정하지 않는다.

## 제품 한 줄

전화번호로 로그인하는 다지점 근무일정 PWA. 시스템관리자는 슈퍼권한, 대표는 모든 지점의 직원 관리·공지·일정 변경 승인, 직원은 본인 정보와 같은 지점 일정을 본다. 출근/퇴근 기록은 없다.

## 로그인

- ID = 핸드폰 번호 (이메일 없음). 입력은 전화번호 + 비밀번호
- 이름은 모든 계정에 필수. 로그인 ID는 아니지만 목록·일정 화면에 이름으로 표시
- 대표가 직원을 만들 때 초기 비밀번호는 항상 `1234`
- 공개 가입 없음
- Supabase Auth는 내부적으로 `{전화번호}@internal.local` 사용. 화면에는 전화번호와 이름만 보여 준다

## 계정 유형

| 유형 | 지점 | 권한 |
|---|---|---|
| 시스템관리자 | 없음(전체) | 슈퍼권한. 지점 생성, 모든 계정(대표 포함), 전체 일정/공지 |
| 대표 | 없음(모든 지점) | 지점 추가. 모든 지점 직원 관리. 공지 작성·발송(지점 선택 또는 전체). 모든 지점 일정 변경 요청 승인. 모든 지점 일정 조회 |
| 직원 | 자기 지점 1개 | 같은 지점 사람들 일정 조회. 본인 정보 수정(이름, 전화, 비밀번호). 근무일정 변경 요청. 상태: 근무중 / 퇴사 |

직원 상태: **근무중** | **퇴사**. 생성 시 기본값은 근무중.

- 근무중: 로그인, 일정, 공지 수신
- 퇴사: 로그인 불가. 일정 목록·공지 대상에서 제외. 직원 목록에는 남김

대표가 직원 계정 생성 시 입력: **이름, 전화번호, 지점**. 비밀번호는 `1234`로 고정.

시스템관리자가 대표를 만들 때는 **이름, 전화번호**. 대표는 지점에 소속되지 않는다.

## 1차 범위

1. 로그인 — 전화번호 + 비밀번호. 계정에는 이름 필수
2. 지점 — 여러 개. 시스템관리자와 대표가 추가·관리
3. 계정 발급 — 시스템관리자: 모든 유형. 대표: 직원만. 직원 상태 근무중/퇴사
4. 근무일정 — 기본 09:00–18:00. **구글 캘린더형 월간 UI**(셀 안 이벤트 칩 + 아래 당일 아젠다). 관리자는 캘린더와 배정을 **한 화면**. 직원은 같은 지점 일정을 같이 봄. 변경이 필요하면 그 날짜에서 요청. 출근/퇴근 버튼은 없음
5. 내 정보 — 직원은 본인 이름/전화/비밀번호만 수정
6. PWA — 홈 화면 설치
7. 푸시
   - 대표가 공지 작성·보내기 → 선택한 지점(또는 전체) 직원에게 푸시
   - 직원이 근무일정 변경 요청 → 대표에게 푸시

시간대: Asia/Seoul.

## 1차에 넣지 않는 것

- 직원 출근/퇴근 기록
- 출근/퇴근 리마인더 푸시
- 일정 변경 완료 푸시
- GPS/QR, 연차·휴가, 급여, 카카오 로그인, 야근 수당, 오프라인 출근
- Supabase Cron 예약 발송

## 화면

```
/login                         전화번호 + 비밀번호

/app                           직원 홈 (PWA 시작)
  홈 화면 추가 안내 (iOS: 공유 → 홈 화면에 추가)
  알림 허용
  같은 지점 월간 캘린더
  날짜 탭 → 근무자·시간, 변경 요청
  내 정보 수정

/admin                         월간 캘린더 + 배정 (한 화면)
  구글 캘린더형: 월 그리드 + 선택한 날 아젠다
  지점 필터. 날짜에서 근무자 추가/시간 수정/삭제
  변경 요청 승인/거절도 이 화면

/admin/employees               직원 목록 + 발급
  이름, 전화번호, 지점, 상태(근무중/퇴사) (비번 1234 안내)

/admin/branches                지점 목록 + 추가 (시스템관리자, 대표)

/admin/notices                 공지 작성 → 지점 선택 또는 전체 직원에게 푸시
```

로그인 후: 직원 → `/app`, 대표·시스템관리자 → `/admin`.

## 데이터

```
branches
  id, name

profiles
  id                 auth.users와 동일
  phone              로그인 ID, 유니크
  name               필수. 화면 표시용
  role               system_admin | owner | employee
  status             active | resigned
  branch_id          직원만 필수. 시스템관리자·대표는 null

work_schedules
  user_id, work_date
  start_time, end_time     기본 09:00 / 18:00
  (user_id + work_date 유니크)

schedule_change_requests
  id, user_id, work_date
  requested_start, requested_end, reason
  status             pending | approved | rejected
  reviewed_by

notices
  id, author_id, branch_id, title, body, created_at
  branch_id null이면 전 지점 공지

push_subscriptions
  user_id, endpoint, p256dh, auth
  (endpoint 유니크)
```

## 기술

- Next.js 16 App Router, TypeScript, Tailwind
- PWA: `app/manifest.ts` + 아이콘 + 서비스 워커
- 푸시: `web-push` + VAPID (이벤트 즉시 발송만)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
```
