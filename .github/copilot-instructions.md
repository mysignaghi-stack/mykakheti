# MyKakheti — AI Agent Coding Guide

## Quick start (local)
- `npm install`
- `npm run dev` (dev server; uses `TURBOPACK=0`)
- `npm run build` / `npm run lint` for CI parity
- If `.next/dev/lock` blocks dev: kill stale `next dev` processes, then retry

## Architecture & data flow
- Next.js App Router only: routes and UI live under `app/` with API handlers in `app/api/**/route.ts`.
- Supabase browser client: `app/lib/supabase.ts` (requires `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- Supabase admin/service role client: `app/lib/supabaseAdmin.ts` (requires `SUPABASE_SERVICE_ROLE_KEY`); used in admin APIs to bypass RLS.
- Middleware auth plumbing: `middleware.ts` uses `createServerClient` and must return the provided response with cookies intact.

## Admin auth + moderation patterns
- Admin detection: `app/lib/adminAuth.ts` (`role` / `is_admin` flags and optional `roles` array). Supports allowlist via `NEXT_PUBLIC_ADMIN_EMAILS` (Google provider only).
- UI auth state: `app/hooks/useAdminAuth.ts` handles refresh-token errors and cleans local/session storage.
- Admin moderation flow: `app/admin/moderate/page.tsx` pulls pending announcements and listens to realtime inserts/updates.
- Approval API mirrors data into community tables based on category: `app/api/admin/announcements/approve/route.ts`.
- Pending announcements API uses service role reads in `app/api/admin/announcements/pending/route.ts`.
- Admin post creation uses session auth + service role insert: `app/api/admin/posts/create/route.ts`.

## Realtime + chat conventions
- Use the shared subscription helper in `app/lib/squareRealtime.ts` (single channel + BroadcastChannel mirroring).
- Chat UI: `app/components/features/KakhetianSquare.tsx` uses optimistic IDs (`temp-...`) and reconciles server inserts; keep message limit at `MESSAGE_LIMIT`.
- Popup wrapper: `app/components/features/ChatPopup.tsx` mounts the chat in a floating container.

## Project-specific conventions
- UI strings are Georgian; keep code/variables in English.
- UI components live in `app/components/**`, hooks in `app/hooks/**`, shared logic in `app/lib/**`.
- Prefer `types/supabase.ts` for DB types; when schema is missing, `as any` is used to avoid build failures.

## External assets + integrations
- Congrats music files live in `public/music` and are referenced from `app/community/congratulations/submit/page.tsx`.
- Client-side image uploads often use `browser-image-compression` (see `KakhetianSquare.tsx`).

## Debugging hints
- Watch DevTools for `[squareRealtime]` logs when troubleshooting realtime.
- Admin setup scripts live at repo root (see `ADMIN_SETUP_README.md`, `one_click_admin_fix.sql`).

## Key files to check when changing behavior
- Supabase clients/envs: `app/lib/supabase.ts`, `app/lib/supabaseAdmin.ts`
- Auth + middleware: `app/lib/adminAuth.ts`, `app/hooks/useAdminAuth.ts`, `middleware.ts`
- Chat/realtime: `app/components/features/KakhetianSquare.tsx`, `app/lib/squareRealtime.ts`
- Admin moderation: `app/admin/moderate/page.tsx`, `app/api/admin/announcements/*/route.ts`