/**
 * Server-only Supabase client.
 *
 * Uses the new-format secret API key (`sb_secret_...`, formerly the
 * `service_role` JWT) — bypasses RLS, full read/write authority. This file
 * MUST never be imported into a `"use client"` component. The
 * `import "server-only"` line below is a Next.js guard: if any client
 * component (directly or transitively) imports this file, the build fails.
 *
 * When auth lands later, we'll add a publishable-key client (`sb_publishable_...`)
 * for client-side reads. For now, all DB access goes through server
 * components, route handlers, or the seed script — and they all hit this
 * client.
 */
import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_YUVABE_PEOPLE_SUPABASE_URL;
const secretKey = process.env.NEXT_PUBLIC_YUVABE_PEOPLE_SUPABASE_KEY;

if (!url) {
  throw new Error(
    "SUPABASE_URL is not set. Add it to .env.local — see .env.example."
  );
}
if (!secretKey) {
  throw new Error(
    "SUPABASE_SECRET_KEY is not set. Add it to .env.local — see .env.example."
  );
}

/**
 * Single shared client. Supabase JS is safe to share across requests on the
 * server because each call carries its own connection from the underlying
 * fetch pool — no per-user state lives here.
 *
 * The client accepts both new (`sb_secret_...`) and legacy (`service_role`
 * JWT) key formats with no code change.
 */
const baseClient: SupabaseClient = createClient(url, secretKey, {
  auth: {
    // Server-only: never persist sessions to disk or refresh tokens automatically.
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * In development, wrap `.from(...)` so each query logs to the server terminal
 * with timing and row count. Lets you see what's hitting the database without
 * opening the Supabase dashboard. No-op in production.
 *
 * Output:
 *   [supabase] from('jobs').select().is('archived_at',null) → 3 rows in 84ms
 *   [supabase] from('jobs').insert(…) ERROR 23505: duplicate key value in 12ms
 *
 * Implementation: supabase-js builders are thenables (they implement `.then`
 * but defer query execution until awaited). A Proxy intercepts the chain
 * methods (recording each call) and the terminal `.then` (timing + counting).
 * Insert/update payloads are masked as `…` to keep logs readable and avoid
 * spilling row data into the terminal.
 */
function instrument(client: SupabaseClient): SupabaseClient {
  if (process.env.NODE_ENV === "production") return client;

  type ChainCall = { method: string; args: unknown[] };

  const formatArg = (arg: unknown): string => {
    if (typeof arg === "string") return `'${arg}'`;
    if (typeof arg === "number" || typeof arg === "boolean") return String(arg);
    if (arg === null) return "null";
    if (Array.isArray(arg)) return "[…]";
    if (typeof arg === "object") return "{…}";
    return "?";
  };

  const formatCalls = (table: string, calls: ChainCall[]): string => {
    const parts = [`from('${table}')`];
    for (const { method, args } of calls) {
      parts.push(`${method}(${args.map(formatArg).join(", ")})`);
    }
    return parts.join(".");
  };

  const wrap = <T extends object>(
    target: T,
    table: string,
    calls: ChainCall[],
    start: number
  ): T => {
    return new Proxy(target, {
      get(obj, prop) {
        const value = Reflect.get(obj, prop);
        if (typeof value !== "function") return value;

        // Terminal `.then` — log the completed chain when the query resolves.
        if (prop === "then") {
          return function (
            onFulfilled?: (v: unknown) => unknown,
            onRejected?: (e: unknown) => unknown
          ) {
            return (value as (...args: unknown[]) => unknown).call(
              obj,
              (result: { data?: unknown; error?: { code?: string; message?: string } }) => {
                const elapsed = Date.now() - start;
                const summary = formatCalls(table, calls);
                const count = Array.isArray(result?.data)
                  ? `${result.data.length} rows`
                  : result?.data
                    ? "1 row"
                    : "0 rows";
                const errorPart = result?.error
                  ? ` ERROR ${result.error.code ?? "?"}: ${result.error.message}`
                  : "";
                console.log(`[supabase] ${summary} → ${count} in ${elapsed}ms${errorPart}`);
                return onFulfilled?.(result);
              },
              onRejected
            );
          };
        }

        // Chain method — record the call and wrap whatever it returns.
        return function (...args: unknown[]) {
          calls.push({ method: String(prop), args });
          const ret = (value as (...args: unknown[]) => unknown).apply(obj, args);
          if (ret && typeof ret === "object") {
            return wrap(ret, table, calls, start);
          }
          return ret;
        };
      },
    });
  };

  const origFrom = client.from.bind(client);
  // Override `.from` to start a fresh trace for each query chain.
  (client as unknown as { from: typeof origFrom }).from = ((table: string) => {
    const builder = origFrom(table);
    return wrap(builder, table, [], Date.now());
  }) as typeof origFrom;

  return client;
}

export const supabase: SupabaseClient = instrument(baseClient);
