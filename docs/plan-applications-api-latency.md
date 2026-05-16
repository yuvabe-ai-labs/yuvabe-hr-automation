# Plan: Fix `/api/applications` Latency (5–10s → ~500ms)

## Context

The `POST /api/applications` route is used by external sites to accept job applications (name, email, resume file). Applicants are experiencing 5–10 second response times before they get a confirmation. The LLM scoring work was already correctly moved to the background, but several other slow operations still block the HTTP response.

---

## Root Causes (ranked by impact)

### 1. No CORS handling — external preflight hangs

**File:** [`middleware.ts:22-26`](../middleware.ts#L22-L26), [`app/api/applications/route.ts`](../app/api/applications/route.ts)

When an external site calls this endpoint, the browser sends an `OPTIONS` preflight request first to check CORS permissions. The route has no `OPTIONS` handler and returns no `Access-Control-Allow-*` headers. The browser either blocks the request entirely or retries, adding a full round-trip of latency before the `POST` even starts.

**Fix:** Add an `OPTIONS` export to the route that returns the correct `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, and `Access-Control-Allow-Headers` headers. Also add those same headers to every `POST` response.

---

### 2. Storage upload blocks the response (biggest time sink)

**File:** [`app/api/applications/route.ts:168-173`](../app/api/applications/route.ts#L168-L173)

```ts
// Currently — runs BEFORE 201 is returned
const { error: storageError } = await supabase.storage
  .from("resumes")
  .upload(storagePath, fileBuffer, { ... });
```

A typical PDF resume is 200 KB–2 MB. Uploading it to Supabase Storage over the network takes 1–4 seconds. The LLM scoring was correctly moved to `processInBackground`, but the file upload was not — it still blocks the response.

**Fix:** Move the storage upload into `processInBackground`. To do this without losing the storage path:
1. Pre-generate `candidateId` with `crypto.randomUUID()` before any DB call.
2. Derive `storagePath` immediately (no upload yet) — `${jobCode}/${candidateId}.${ext}`.
3. Create the candidate and application records, return `201` immediately.
4. In the background: upload the file, get the public URL, update the `applications` row's `resume_url` — same pattern already used for `match_score` and `match_breakdown`.

---

### 3. Three sequential DB round trips

**File:** [`app/api/applications/route.ts:138,155,182`](../app/api/applications/route.ts#L138)

```
getJobByCode(jobCode)    → wait ~150ms   (round trip 1)
createCandidate(...)     → wait ~150ms   (round trip 2)
createApplication(...)   → wait ~150ms   (round trip 3)
```

Steps 1 and 2 are independent — the job lookup and candidate creation don't need each other's result. Running them sequentially wastes ~150ms.

**Fix:** Parallelize with `Promise.all`:

```ts
// Before
const job = await getJobByCode(jobCode);
const candidate = await createCandidate(...);

// After — both fire at the same time, finish together
const [job, candidate] = await Promise.all([
  getJobByCode(jobCode),
  createCandidate(...),
]);
```

`createApplication` still runs third because it needs both `job.id` and `candidate.id`.

---

### 4. Dynamic `import("@/lib/supabase")` inside the handler

**File:** [`app/api/applications/route.ts:150`](../app/api/applications/route.ts#L150)

```ts
// Inside the POST handler body — runs on every request
const { supabase } = await import("@/lib/supabase");
```

`supabase` is already imported statically by `candidates-store.ts` and `applications-store.ts`, so the module is loaded. But calling `await import(...)` inline adds dynamic resolution overhead, especially on cold starts. It also appears again inside `processInBackground` at line 81.

**Fix:** Replace both dynamic imports with a single top-level static import:

```ts
import { supabase } from "@/lib/supabase";
```

---

## Expected outcome

| Phase | Before | After |
|---|---|---|
| OPTIONS preflight | hangs / fails | ~50ms (immediate header response) |
| DB round trips | ~450ms sequential | ~300ms (2 parallel + 1 serial) |
| Storage upload | ~1–4s blocking | moved to background |
| Cold start import | extra module eval | eliminated |
| **Total to 201** | **5–10s** | **~500ms** |

---

## Files to change

| File | What changes |
|---|---|
| [`app/api/applications/route.ts`](../app/api/applications/route.ts) | Add `OPTIONS` handler, CORS headers on POST, move storage upload to background, parallelize job+candidate fetches, replace dynamic imports |

No other files need to change.

---

## Verification

1. From an external origin, submit a `POST` to `/api/applications` with `multipart/form-data` (name, email, jobCode, resume PDF).
2. Check browser DevTools → Network: preflight `OPTIONS` should return 204 in <100ms; `POST` should return 201 in <1s.
3. Wait ~30s, reload the applicant detail page — resume URL and match score should be populated (background processing completed).
4. Check server logs for `[applications/bg]` entries confirming upload + LLM ran successfully.
