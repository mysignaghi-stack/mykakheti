# MyKakheti AI Agent Coding Guide

## Project Overview
- **Framework:** Next.js 16.1.2 (App Router, Turbopack)
- **Database/Auth:** Supabase (via `@supabase/ssr`)
- **Styling:** Tailwind CSS
- **Language:** TypeScript (strict mode)

## Architecture & Structure
- **App Router only:** All routing and pages use the App Router paradigm.
- **UI Components:** Place in `app/components/`. No JSX/HTML in `.ts` files—UI must be `.tsx` only.
- **Business Logic:** All Supabase clients, hooks, and logic in `app/lib/`.
- **Types:** Use `types/supabase.ts` for DB types. If a table is missing, use `as any` to avoid build errors.
- **Admin:** Admin-only pages in `app/admin/`. Use `useAdminAuth` for protection. Test password: `AILajaxak1986.`

## Key Conventions
- **Naming:**
	- DB tables: `snake_case` (e.g., `admin_posts`)
	- Frontend types: `PascalCase` (e.g., `AdminRoute`)
	- UI: Georgian for user-facing text, English for code/variables
- **Supabase:**
	- Use `createBrowserClient` for client-side calls
	- Always type queries with `types/supabase.ts` when possible
- **File Placement:**
	- UI: `app/components/`
	- Logic: `app/lib/`
	- Admin: `app/admin/`

## Developer Workflows
- **Install dependencies:** `npm install`
- **Run dev server:** `npm run dev`
- **Supabase CLI:**
	- Install: `npm i supabase --save-dev` (see README for OS-specific options)
	- Bootstrap project: `npx supabase bootstrap`
- **Type generation:** Use Supabase CLI to generate types from DB schema
- **Admin setup:** See `ADMIN_SETUP_README.md` for one-click admin role setup and troubleshooting
- **Music assets:** Add MP3s to `public/music/` and update `MUSIC_OPTIONS` in `/app/community/congratulations/submit/page.tsx` (see `public/music/README.md`)

## Patterns & Examples
- **Community features:** See `app/components/community/CommunityWidgets.tsx` and `CommunityEngagement.tsx` for sector logic
- **Agro data:** Managed via `app/hooks/useAgroData.ts` and Supabase table `agro_prices`
- **Admin diagnostics:** See `app/admin/moderation/page.tsx` for API and row count checks
- **Health checks:** `app/admin/health/page.tsx` for system status UI

## Integration & Data Flow
- **Supabase:** All data access via Supabase client in `app/lib/`. Use RLS and policies as defined in SQL files for security.
- **External assets:** Music and images in `public/`, referenced in UI components

## Special Notes
- **Do not:**
	- Place business logic in UI files
	- Mix JSX/HTML in `.ts` files
	- Use English for UI text
- **Do:**
	- Reference `README.md` and `ADMIN_SETUP_README.md` for setup and troubleshooting
	- Follow file/folder structure strictly for maintainability

---
For unclear or missing conventions, review `README.md`, `ADMIN_SETUP_README.md`, and example files in `app/components/` and `app/lib/`.