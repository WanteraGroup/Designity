# Designity

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-eoshb1wd)


## DESIGNLY AI / Groq

The editor now includes a server-side Groq AI editor endpoint at `supabase/functions/designly-editor-ai`.
It returns structured, allow-listed design changes instead of executable code.

Recommended Supabase function secrets:
- `GROQ_API_KEY`
- `DESIGNLY_GROQ_MODEL` (optional; defaults to `openai/gpt-oss-120b`)
- `AI_PROVIDER=groq` for the master design agent
- `AI_MODEL=openai/gpt-oss-120b` (optional)
- `AI_IMAGE_API_KEY` or `OPENAI_API_KEY` for image previews, because Groq handles the reasoning but does not replace the existing image-preview provider.

The editor charges 1 credit per successful AI edit for non-owner users. Failed provider requests do not apply a credit charge.
