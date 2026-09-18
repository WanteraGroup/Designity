export type DesignlyAgentId =
  | 'master'
  | 'brand'
  | 'web'
  | 'social'
  | 'marketing'
  | 'content'
  | 'template'
  | 'tiktok_shop_research'
  | 'tiktok_shop_product'
  | 'tiktok_shop_listing'
  | 'tiktok_shop_creative'
  | 'tiktok_shop_video'
  | 'tiktok_shop_campaign'
  | 'tiktok_shop_health'
  | 'monkey_design_director'
  | 'monkey_logo'
  | 'monkey_brand'
  | 'monkey_uiux'
  | 'monkey_web'
  | 'monkey_social'
  | 'monkey_marketing'
  | 'monkey_print'
  | 'monkey_presentation'
  | 'monkey_qa';

export interface DesignlyAgent {
  id: DesignlyAgentId;
  name: string;
  purpose: string;
  outputs: string[];
}

export const TIKTOK_SHOP_AGENT_TEAM: DesignlyAgent[] = [
  { id:'tiktok_shop_research', name:'TikTok Shop Research Agent', purpose:'Termék-, kategória- és piaci kutatás; keresleti jelek strukturálása.', outputs:['product research','market signals','opportunity brief'] },
  { id:'tiktok_shop_product', name:'TikTok Shop Product Agent', purpose:'Termékválasztás, ajánlatstruktúra és termékpozicionálás.', outputs:['product shortlist','offer structure','positioning'] },
  { id:'tiktok_shop_listing', name:'TikTok Shop Listing Agent', purpose:'Termékcím, leírás, bullet pointok és kereshető listing-struktúra.', outputs:['title','description','listing structure'] },
  { id:'tiktok_shop_creative', name:'TikTok Shop Creative Agent', purpose:'Termékoldali és social kreatív koncepciók a DESIGNLY Brand Kit alapján.', outputs:['product creative','image direction','creative variants'] },
  { id:'tiktok_shop_video', name:'TikTok Shop Video Agent', purpose:'Rövid videóötletek, hookok, jelenetvázlatok és CTA-k.', outputs:['hooks','video scripts','shot lists'] },
  { id:'tiktok_shop_campaign', name:'TikTok Shop Campaign Agent', purpose:'Promóciós kampányok, ajánlatok és tartalomtervek összehangolása.', outputs:['campaign brief','content calendar','offer variants'] },
  { id:'tiktok_shop_health', name:'TikTok Shop Health Agent', purpose:'Shop-működéshez kapcsolódó ellenőrzőlista és problémák rendszerezése.', outputs:['health checklist','issue summary','next actions'] },
];

export const MONKEY_DESIGN_AGENT_TEAM: DesignlyAgent[] = [
  { id:'monkey_design_director', name:'Monkey Design Director', purpose:'Kreatív irányítás és a teljes designfeladat koordinálása.', outputs:['creative direction','design system','art direction'] },
  { id:'monkey_logo', name:'Monkey Logo Agent', purpose:'Logó- és emblémairányok, variációk és használati szabályok.', outputs:['logo concepts','logo directions','usage rules'] },
  { id:'monkey_brand', name:'Monkey Brand Agent', purpose:'Teljes márkaarculat és Brand Kit felépítése.', outputs:['brand identity','brand kit','guidelines'] },
  { id:'monkey_uiux', name:'Monkey UI/UX Agent', purpose:'Digitális termékek UX-hierarchiája, komponensei és felhasználói útvonalai.', outputs:['UX flow','UI system','component direction'] },
  { id:'monkey_web', name:'Monkey Web Design Agent', purpose:'Prémium weboldal- és landing-page design, reszponzív struktúra.', outputs:['website design','landing page','responsive layout'] },
  { id:'monkey_social', name:'Monkey Social Design Agent', purpose:'Social post, story és kampánykreatív rendszer.', outputs:['social templates','post variants','story system'] },
  { id:'monkey_marketing', name:'Monkey Marketing Creative Agent', purpose:'Hirdetések, flyerek, plakátok és marketinganyagok vizuális rendszere.', outputs:['ad creative','flyer','poster','campaign assets'] },
  { id:'monkey_print', name:'Monkey Print Design Agent', purpose:'Nyomdai anyagok, brosúrák, névjegyek és árlisták előkészítési iránya.', outputs:['print layouts','brochure','business card'] },
  { id:'monkey_presentation', name:'Monkey Presentation Agent', purpose:'Prezentációk és pitch deckek vizuális rendszere.', outputs:['slides','pitch deck','presentation system'] },
  { id:'monkey_qa', name:'Monkey Visual QA Agent', purpose:'Vizuális konzisztencia, hierarchia, márka- és exportellenőrzés.', outputs:['visual QA','brand consistency','export checklist'] },
];

export const DESIGNLY_AGENT_TEAM: DesignlyAgent[] = [
  {
    id: 'master',
    name: 'DESIGNLY Master Agent',
    purpose: 'A felhasználói brief értelmezése, feladatbontás és specialisták koordinálása.',
    outputs: ['structured brief', 'creative direction', 'specialist plan'],
  },
  {
    id: 'brand',
    name: 'Brand Agent',
    purpose: 'Márkaidentitás, logóirány, színek, tipográfia és Brand Kit konzisztencia.',
    outputs: ['logo direction', 'brand identity', 'brand kit'],
  },
  {
    id: 'web',
    name: 'Web Agent',
    purpose: 'Landing page és teljes weboldal struktúra, UX, reszponzív hierarchia.',
    outputs: ['landing page', 'website', 'responsive structure'],
  },
  {
    id: 'social',
    name: 'Social Agent',
    purpose: 'Social posztok, storyk és platform-specifikus vizuális hierarchia.',
    outputs: ['social post', 'social story', 'platform variants'],
  },
  {
    id: 'marketing',
    name: 'Marketing Agent',
    purpose: 'Flyer, plakát, brosúra, árlista, meghívó és kampányrendszer.',
    outputs: ['flyer', 'poster', 'brochure', 'campaign'],
  },
  {
    id: 'content',
    name: 'Content Agent',
    purpose: 'Headline, CTA, rövid marketing szöveg és tartalmi struktúra.',
    outputs: ['headlines', 'CTA', 'content structure'],
  },
  {
    id: 'template',
    name: 'Template Agent',
    purpose: 'Sablonok címkézése, kategorizálása és briefhez illesztése.',
    outputs: ['template matching', 'template metadata'],
  },
];