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


### Agent stack

DESIGNLY now has a modular AI stack:

- **Master Agent:** Groq GPT-OSS 120B with Structured Outputs.
- **Compound mode:** set `DESIGNLY_GROQ_MODEL=groq/compound` for Groq-managed web search/code-execution workflows; Compound supports multiple tool calls, while Compound Mini is the lower-latency single-tool variant. citeturn1search1turn1search3
- **Editor Agent:** safe, allow-listed visual changes with credit control.
- **Vision Agent:** Qwen 3.6 27B image analysis through Groq. citeturn1search2
- **Voice Agent:** Groq Whisper transcription through a server-side Edge Function.
- **MCP-ready architecture:** the provider layer is kept server-side so remote MCP can be added without exposing API keys. Groq supports OpenAI-compatible remote MCP through its Responses API. citeturn0search9

For strict structured JSON, GPT-OSS 120B supports Groq Structured Outputs. Tool use and Structured Outputs are separate modes in the current Groq API, so the Compound path intentionally uses JSON Object Mode instead. citeturn0search0turn0search3

## Unified Agent Layer

DESIGNLY now contains a shared agent registry and orchestration plan at:
- `supabase/functions/_shared/agent-registry.ts`
- `supabase/functions/_shared/orchestrator.ts`

The registry consolidates reusable capabilities identified across the WanteraGroup projects:
- VYRON/NEXORA: business planning, MVP/product factory, research, tech scouting, builder, reviewer and sales
- TRENOVA/WANTERA: commerce, TikTok Shop, product/listing, campaign and social publishing workflows
- MIRA/Mira-Mobile: assistant, voice, multilingual translation/interpreter, reminders/mobile concepts
- VEYRA: realtime translation architecture and a browser-only free translation fallback
- DESIGNLY: Master, Brand, Web, Social, Marketing, Content, Vision, Voice and safe AI editor
- HUGINN: user-facing DESIGNLY guide/navigation agent
- AVENTOR/WANTERA: procurement and recruitment capability definitions

The orchestrator selects relevant specialists from the request and exposes the selected plan to the Master Agent response. Provider credentials and external side effects remain server-side and are only enabled when the corresponding integration is actually configured and authorized.

This layer is deliberately capability-based: source projects are not blindly copied across incompatible runtimes. Reusable logic is represented as shared agent contracts, while provider-specific code remains isolated behind adapters.
