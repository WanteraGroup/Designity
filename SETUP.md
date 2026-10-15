# DESIGNLY v2 — setup

## 1. Create the Supabase project

Europe West (`eu-west-1`) is where Wave 1 ran: the market is Hungarian and the
round trip matters more than the storage region.

## 2. Run the schema

Paste `supabase/migrations/00_bootstrap.sql` into the SQL editor, or:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

## 3. Set the function secrets

```bash
supabase secrets set --env-file supabase/.env.example
```

`GROQ_API_KEY` is required. `DESIGNLY_GROQ_MODEL` is optional and defaults to
`openai/gpt-oss-120b`.

## 4. Deploy the agents

```bash
supabase functions deploy designly-agent
supabase functions deploy designly-editor-ai
```

Both are JWT-verified. The agent accepts an anonymous caller for the `polish`
stage only, so the landing page can preview a plan; everything else needs a
session.

## 5. Point the app at the project

```bash
cp .env.example .env
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

## 6. Claim owner

Sign up, then promote your own row. Until this runs, the admin surfaces stay
locked:

```sql
UPDATE profiles SET role = 'owner', plan_id = 'owner', unlimited_access = true
WHERE email = 'you@example.com';
```

## Credits

Signup grants 10 credits. A website costs 10, an AI edit costs 1. The charge is
reserved before the provider call and released if the provider fails, so a
timeout never bills for a page that was not built.

| Action | Credits |
| --- | --- |
| Social post, business card, invitation, flyer, menu, price list | 2 |
| Poster, logo, advertisement, banner | 3 |
| Brochure, brand identity, presentation, landing page | 5 |
| Campaign bundle, full website, custom | 10 |
| AI edit | 1 |

Rates live in `system_settings.generation_costs` and are read server-side, so a
price change is a row update rather than a deploy.
