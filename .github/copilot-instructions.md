# MyKakheti Project Instructions

## Project Stack
- Framework: Next.js 16.1.2 with Turbopack
- Database & Auth: Supabase (using @supabase/ssr)
- Styling: Tailwind CSS
- Language: TypeScript (Strict Mode)

## Architecture Rules
- Use App Router structure only.
- Components should be in `app/components/`.
- Business logic and Supabase clients must stay in `app/lib/`.
- **CRITICAL:** Never put JSX/HTML code in `.ts` files. All UI must be in `.tsx` files.

## Supabase & Type Safety
- Always reference types from `types/supabase.ts`.
- When fetching data, if a table is not yet fully defined in the Database interface, use type assertion (e.g., `as any`) to prevent 'never' type errors during build.
- Use `createBrowserClient` for client-side Supabase calls.

## Admin Rules
- Admin password for testing: `AILajaxak1986.`
- Admin-only routes are located in `app/admin/`.
- Use the `useAdminAuth` hook for protecting admin components.

## Naming & Conventions
- Database tables: snake_case (e.g., `transport_routes`, `admin_posts`).
- Frontend types: PascalCase (e.g., `AdminRoute`).
- Use Georgian for UI text and English for logic/variables.