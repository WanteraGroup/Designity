import { DESIGNLY_AGENT_REGISTRY } from "./agent-registry.ts";

export type OrchestrationPlan = {
  agents: string[];
  capabilities: string[];
  reasons: Record<string, string>;
};

const rules: Array<{ id: string; terms: RegExp[]; reason: string }> = [
  { id: "vyron", terms: [/üzleti terv/i,/üzleti ötlet/i,/business plan/i,/mvp/i,/0\s*ft/i,/indulótőke/i], reason: "üzleti és MVP-specifikáció szükséges" },
  { id: "tiktok-shop", terms: [/tiktok\s*shop/i,/seller/i,/shop/i,/termék.*eladás/i], reason: "social-commerce folyamat szükséges" },
  { id: "video", terms: [/videó/i,/video/i,/tiktok/i,/reels/i,/shorts/i,/ugc/i,/reklámfilm/i], reason: "videó/kreatív gyártás szükséges" },
  { id: "marketing", terms: [/marketing/i,/kampány/i,/hirdetés/i,/ads/i,/social/i], reason: "kampány és marketing kimenetek szükségesek" },
  { id: "sales", terms: [/értékesítés/i,/eladás/i,/ajánlat/i,/upsell/i,/sales/i], reason: "értékesítési folyamat szükséges" },
  { id: "voice", terms: [/hang/i,/voice/i,/beszéd/i,/telefon/i,/voiceover/i], reason: "hangalapú interakció szükséges" },
  { id: "translator", terms: [/fordít/i,/tolmács/i,/translation/i,/multilingual/i,/többnyelv/i], reason: "fordítás/tolmácsolás szükséges" },
  { id: "procurement", terms: [/beszerzés/i,/procurement/i,/supplier/i,/beszállító/i,/b2b/i], reason: "B2B procurement folyamat szükséges" },
  { id: "recruitment", terms: [/toborz/i,/recruit/i,/állás/i,/jelölt/i,/talent/i], reason: "recruitment/talent folyamat szükséges" },
  { id: "social-publisher", terms: [/közzététel/i,/publish/i,/tiktok.*közz/i,/social.*publish/i], reason: "engedélyezett social publishing workflow szükséges" },
];

export function buildOrchestrationPlan(brief: string, requestedOutputs: string[] = []): OrchestrationPlan {
  const text = [brief, ...requestedOutputs].join("\n");
  const ids = new Set<string>(["design-master", "content", "brand", "reviewer", "builder"]);
  const reasons: Record<string, string> = {
    "design-master": "minden DESIGNLY projekt központi design-orchestrationt igényel",
    content: "a végső projektnek koherens tartalom és CTA kell",
    brand: "a vizuális rendszer konzisztenciája miatt",
    reviewer: "minőségellenőrzés miatt",
    builder: "menthető, build-ready projekt specifikáció miatt",
  };

  for (const rule of rules) {
    if (rule.terms.some((term) => term.test(text))) {
      ids.add(rule.id);
      reasons[rule.id] = rule.reason;
    }
  }

  const agents = DESIGNLY_AGENT_REGISTRY.filter((agent) => ids.has(agent.id)).map((agent) => agent.id);
  const capabilities = [...new Set(
    DESIGNLY_AGENT_REGISTRY.filter((agent) => ids.has(agent.id)).flatMap((agent) => agent.capabilities)
  )];

  return { agents, capabilities, reasons };
}
