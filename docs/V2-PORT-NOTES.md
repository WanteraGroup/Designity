# DESIGNLY v2

Branch `v2`, cut from `main` at `a2d6203`.

The goal is not to copy the Wave 1 platform file by file. Most of it was
built for a demo, and bolting a second generation onto the same structure
is what the consolidation work below is meant to avoid.

## What actually comes across

Three things carry over, because they are the parts that were right:

1. **The data model.** `supabase/migrations/00_bootstrap.sql` is the eleven
   core tables from Wave 1 with their RLS policies and the credit engine
   intact. It is a single file now: the follow-up migrations that only
   repriced or re-seeded the same rows are folded in, so a fresh project
   boots from one file instead of thirty-three.
2. **The catalogue content.** Twenty-four design styles, twenty-four
   template categories, ten languages, the plan ladder, the credit
   packages and the per-type credit costs. This is the part that took
   real thought in Wave 1 and it is worth keeping verbatim.
3. **The brand layer.** Black and gold, Marcellus over Manrope, the
   Celtic knotwork. It is the visual identity of the product and it is
   in `tailwind.config.js` and the three `designly-brand*.css` files.

## What is rebuilt, not copied

- **The page shell.** Wave 1 routed through a 40-entry `Page` union with
  hand-written `switch` statements and a `hash` router. Every screen pulled
  in every other screen. v2 uses file-based routes and lazy imports.
- **The product surface.** Wave 1 had 27 pages and 40 components, most of
  them demo-only studios (Tattoo, CNC, Streamer, Shopify, Music, Creator).
  v2 starts with the four that a design platform actually needs: the
  dashboard, the create flow, the editor and the template hall. The rest
  come back one at a time, ported deliberately.
- **The agent layer.** Wave 1 exposed twelve Edge Functions, several of
  them with `verify_jwt = false`. v2 keeps the provider boundary
  server-side and requires auth on everything except the payment webhook
  and the public landing assistant.
- **The landings.** `public/designly-landing (4).html` is 2.7 MB of
  pre-built output and `Kelta Minta Keptes _ Use AI.html` is 570 KB. Both
  stay in `main`. The section structure is worth reusing; the artefacts are
  not a foundation.

## What does not come across at all

- API keys and provider secrets. None are in the repository, correctly,
  and none can be moved. They need to be set as Supabase function secrets
  in the new project: `GROQ_API_KEY`, `AI_IMAGE_API_KEY` (or
  `OPENAI_API_KEY`), and the payment provider credentials.
- The live Supabase project and its data. The Wave 1 database is not the
  one connected to this workspace.
- `kor keret.png` and `stilus.png` (4.6 MB combined). They are reference
  screenshots, not product assets. `designly-logo.webp`,
  `designly-knot.svg`, `designly-odin-hall-bg.svg` and `designly-og.svg`
  do carry over and are already in `public/`.

## Bootstrap order

1. Create the new Supabase project (Europe West / `eu-west-1` is where
   Wave 1 lived, and it kept latency down for the Hungarian market).
2. Run `supabase/migrations/00_bootstrap.sql` against it.
3. Set the function secrets listed above.
4. Point `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` at the new
   project, then `npm run dev`.

The first profile row needs `role = 'owner'` set by hand after your own
signup, otherwise the admin surfaces stay locked:

```sql
UPDATE profiles SET role = 'owner', plan_id = 'owner'
WHERE email = 'you@example.com';
```
