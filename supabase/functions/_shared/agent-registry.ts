export type AgentCapability = {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
  source: string;
};

export const DESIGNLY_AGENT_REGISTRY: AgentCapability[] = [
  { id: "huginn", name: "HUGINN", role: "DESIGNLY navigátor és AI asszisztens", capabilities: ["navigation","help","onboarding","project-guidance"], source: "Designity" },
  { id: "vyron", name: "VYRON", role: "üzleti stratégia és Business Builder", capabilities: ["business-plan","product-spec","mvp","pricing","validation","next-steps"], source: "nexora-ai" },
  { id: "design-master", name: "DESIGN MASTER", role: "fő design orchestrator", capabilities: ["website","landing","brand","campaign","visual-direction"], source: "Designity" },
  { id: "brand", name: "BRAND AGENT", role: "brand identity specialist", capabilities: ["logo","colors","typography","brand-kit"], source: "Designity" },
  { id: "content", name: "CONTENT AGENT", role: "content specialist", capabilities: ["headlines","copy","cta","product-copy"], source: "Designity/Nexora" },
  { id: "marketing", name: "MARKETING AGENT", role: "campaign specialist", capabilities: ["campaign","social","ads","funnel"], source: "Designity/Nexora" },
  { id: "product", name: "PRODUCT AGENT", role: "MVP és terméktervező", capabilities: ["product","mvp","features","user-flow"], source: "nexora-ai/Trenova" },
  { id: "tiktok-shop", name: "TIKTOK SHOP AGENT", role: "commerce/social commerce specialist", capabilities: ["tiktok-shop","product-listing","creative","campaign","shop-health"], source: "Trenova/Wantera" },
  { id: "video", name: "VIDEO CREATOR AGENT", role: "rövid videó és reklám kreatív specialist", capabilities: ["video","tiktok-video","reels","shorts","ugc","storyboard","hook","voiceover"], source: "prior Video Creator project" },
  { id: "sales", name: "SALES AGENT", role: "értékesítési specialist", capabilities: ["offer","upsell","cross-sell","sales-copy","follow-up"], source: "nexora-ai" },
  { id: "voice", name: "VOICE AGENT", role: "hangvezérlés és beszédfeldolgozás", capabilities: ["speech-to-text","text-to-speech","voice-command","voice-ui"], source: "Designity/Mira/VEYRA" },
  { id: "translator", name: "TRANSLATION AGENT", role: "multilingual translation/interpreter", capabilities: ["translation","auto-language","interpreter","speech-translation"], source: "Mira-Mobile/VEYRA" },
  { id: "mira", name: "MIRA", role: "személyi AI asszisztens", capabilities: ["assistant","voice","translation","reminders","mobile"], source: "Mira.AI/Mira-Mobile" },
  { id: "procurement", name: "AVENTOR", role: "B2B procurement intelligence", capabilities: ["procurement","supplier-list","product-sourcing","b2b"], source: "AVENTOR project" },
  { id: "recruitment", name: "WANTERA", role: "talent/recruitment intelligence", capabilities: ["recruitment","job-matching","talent","cv"], source: "WANTERA project" },
  { id: "social-publisher", name: "SOCIAL PUBLISHER", role: "social publishing workflow", capabilities: ["tiktok-oauth","direct-post","approval","audit-log"], source: "wantera-platform" },
  { id: "reviewer", name: "REVIEWER", role: "quality and safety review", capabilities: ["qa","validation","risk-review","acceptance"], source: "nexora-ai/Designity" },
  { id: "builder", name: "BUILDER", role: "project build specification", capabilities: ["implementation-plan","project-save","acceptance-criteria"], source: "nexora-ai/Designity" },
];

export function getAgent(id: string) {
  return DESIGNLY_AGENT_REGISTRY.find((agent) => agent.id === id) || null;
}
