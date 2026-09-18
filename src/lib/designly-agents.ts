export type DesignlyAgentId =
  | 'master'
  | 'brand'
  | 'web'
  | 'social'
  | 'marketing'
  | 'content'
  | 'template';

export interface DesignlyAgent {
  id: DesignlyAgentId;
  name: string;
  purpose: string;
  outputs: string[];
}

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