# MyKakheti — AI Agent Coding Guide (concise)
## Quick start
- `npm install`
- `npm run dev` (if you see `.next/dev/lock` errors, kill existing `next dev` processes or remove the lock after verifying no dev server is active)

## Architecture & important files
- App Router only: `app/` contains server and client routes.
- Supabase client: `app/lib/supabase.ts` (uses `createBrowserClient` for client-side code).
- Realtime helpers: `app/lib/squareRealtime.ts` (centralize `supabase.channel(...)` subscriptions and optional BroadcastChannel bridging).
- Chat UI: `app/components/features/KakhetianSquare.tsx` (optimistic UI, temp IDs, file uploads, reconciliation logic).
- Popup wrapper: `app/components/features/ChatPopup.tsx` (mounts `KakhetianSquare` in a floating container).
- Server API example using service role: `app/api/square/send/route.ts` (inserts messages server-side).

## Project-specific conventions
- UI strings are Georgian; keep code/variables in English.
- Place UI in `.tsx` under `app/components/` and logic/hooks in `app/lib/` or `app/hooks/`.
- Use `types/supabase.ts` for DB typing where available; when schema is missing, `as any` is used to avoid build failures.

## Realtime & sync patterns
- Prefer a single shared realtime subscription helper (see `squareRealtime.ts`) rather than per-component random channel names.
- Optimistic UI pattern: create temporary ids (`temp-...`) and replace them when the server responds (see `KakhetianSquare.tsx`).
- Cross-window sync: BroadcastChannel is used to mirror events between popup and main window when necessary.

## Debugging tips
- Watch DevTools console for `[squareRealtime]` logs to trace incoming payloads.
- Search for `temp-` to find optimistic-message logic.
- If `next dev` won't start because of a lock: run `ps aux | grep next`, kill stale processes, then restart.

## Useful files to inspect for common tasks
- Chat & realtime: `app/components/features/KakhetianSquare.tsx`, `app/components/features/ChatPopup.tsx`, `app/lib/squareRealtime.ts`, `app/api/square/send/route.ts`.
- Supabase client and envs: `app/lib/supabase.ts` (requires `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- Announcements / admin examples: `app/admin/moderate/page.tsx` (image arrays, moderation flows).

If you'd like, I can expand the announcements UI section with implementation notes (arrows + mobile swipe). 
For unclear or missing conventions, review `README.md`, `ADMIN_SETUP_README.md`, and example files in `app/components/` and `app/lib/`.