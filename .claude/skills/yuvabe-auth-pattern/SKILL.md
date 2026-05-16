---
name: yuvabe-auth-pattern
description: Use before writing any auth-related code in Yuvabe ATS — middleware.ts, lib/auth.ts, login page, session handling, public route configuration. Documents the current HMAC cookie auth system and the future Supabase Auth SSR upgrade path. Activate before touching middleware.ts, lib/auth.ts, app/login, or any route that needs to be gated or ungated.
---

# Yuvabe — Auth Pattern

## Current auth model

**HMAC-signed session cookie** via `lib/auth.ts`. No custom JWT library, no localStorage, no Supabase Auth (yet).

- Session cookie name: `yuvabe-session`
- TTL: 7 days
- Signing: HMAC-SHA256 via WebCrypto (`AUTH_SECRET` env var)
- Edge-compatible: WebCrypto only, no Node.js crypto module

---

## The two Supabase clients

Two clients exist for different purposes. **Neither should be imported outside of `repositories/`:**

| Client | File | Key | Purpose |
|---|---|---|---|
| Server-only | `lib/supabase.ts` | Service-role secret (`SUPABASE_SECRET_KEY`) | API routes, Server Components via repositories |
| Client-safe | `integrations/supabase-people.ts` | Anon/publishable key | Client-side hooks via repositories |

The `lib/supabase.ts` file has `import "server-only"` at the top — importing it in a client component will fail at build time. This is intentional.

---

## Public routes

Managed in `middleware.ts` via two sets:

```ts
// middleware.ts
const PUBLIC_EXACT = new Set(['/login', '/'])
const PUBLIC_PREFIXES = ['/apply', '/api/apply', '/api/extract-criteria', '/_next', '/api/auth']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic =
    PUBLIC_EXACT.has(pathname) ||
    PUBLIC_PREFIXES.some(p => pathname.startsWith(p)) ||
    pathname === '/favicon.ico'

  if (!isPublic) {
    const session = await verifySession(request)  // lib/auth.ts
    if (!session) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }
  return NextResponse.next()
}
```

**To add a new public route:** add to `PUBLIC_EXACT` (exact path match) or `PUBLIC_PREFIXES` (prefix match). Never add ad-hoc `pathname.startsWith()` checks outside these two sets.

---

## Session helpers (lib/auth.ts)

```ts
// lib/auth.ts — Edge-compatible, WebCrypto only
export async function createSession(payload: SessionPayload): Promise<string>
export async function verifySession(request: NextRequest): Promise<SessionPayload | null>
export async function destroySession(response: NextResponse): Promise<void>
```

These are server-only helpers. Never call them from client components.

---

## Login flow

```tsx
// app/login/_components/login-form.tsx
'use client'

async function onSubmit(values: LoginFormValues) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  })
  if (!res.ok) {
    setError('Invalid credentials')
    return
  }
  router.push(next)
  router.refresh()  // required: server components need to re-render with new session
}
```

---

## ENV vars required

```
AUTH_SECRET                                   — HMAC signing secret (keep long, random)
SUPABASE_URL                                  — Supabase project URL
SUPABASE_SECRET_KEY                           — Service-role key (server-only)
NEXT_PUBLIC_YUVABE_PEOPLE_SUPABASE_URL        — Same URL (client-visible)
NEXT_PUBLIC_YUVABE_PEOPLE_SUPABASE_KEY        — Anon key (client-visible)
```

---

## Future upgrade path — Supabase Auth SSR

When Supabase Auth + RLS is enabled (planned), the auth model will migrate to:

1. Replace HMAC cookie with Supabase Auth SSR cookies (`@supabase/ssr`)
2. Three client setup files: `config/supabase/client.ts` (browser), `config/supabase/server.ts` (server), `config/supabase/middleware.ts` (middleware)
3. Middleware calls `supabase.auth.getUser()` instead of `verifySession()`
4. Login form calls `supabase.auth.signInWithPassword()` directly (no `/api/auth/login`)
5. `proxy.ts` or `middleware.ts` export pattern determined by Next.js 16 version in use

Until this migration, do not introduce `@supabase/ssr` or `supabase.auth` calls — the HMAC cookie system is the single auth mechanism.

---

## Anti-patterns

```ts
// ❌ AUTH_SECRET in a NEXT_PUBLIC_ variable — leaks the signing secret
NEXT_PUBLIC_AUTH_SECRET=...

// ❌ Calling lib/auth.ts helpers from a client component
import { verifySession } from '@/lib/auth'  // server-only

// ❌ localStorage for session state
localStorage.setItem('yuvabe-session', token)

// ❌ Forgetting router.refresh() after login/logout
router.push('/jobs')  // without refresh, server components have stale session

// ❌ Ad-hoc public route check outside the two sets in middleware
if (pathname === '/my-new-public-page') { ... }  // add to PUBLIC_EXACT instead
```
