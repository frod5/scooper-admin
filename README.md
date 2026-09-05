# SCOOPER

다지점 근무일정 PWA. Next.js 16 + Supabase + Vercel.

## 로컬 실행

1. `.env.example`을 복사해 `.env.local`을 채웁니다.
2. Supabase SQL Editor에서 `supabase/schema.sql`을 실행합니다.
3. 웹 푸시 키가 없으면 생성합니다. 비밀키는 Git에 넣지 마세요.

```bash
npx web-push generate-vapid-keys
```

```bash
npm install
npm run dev
```

http://localhost:3000

## 환경 변수

`.env.local`과 Vercel Project Settings → Environment Variables에 동일하게 넣습니다.

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
```

`SUPABASE_SECRET_KEY`와 `VAPID_PRIVATE_KEY`는 서버 전용입니다.

## 배포

GitHub `main`에 푸시하면 Vercel이 빌드합니다. 배포 URL을 Supabase Authentication → URL Configuration의 Site URL / Redirect URLs에 추가하세요.
