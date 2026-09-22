import { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

/**
 * Reads the `?template=` handoff and resolves it into a starting brief.
 *
 * A template is a structure plus a tone, not a finished document, so the
 * handoff passes a brief rather than a document — the create flow then runs
 * normally, which keeps one generation path instead of two.
 */
export interface TemplateSeed {
  name: string | null;
  brief: string;
}

const CATEGORY_TONE: Record<string, string> = {
  Restaurant: 'éttermi, meleg, étvágygerjesztő',
  'Real Estate': 'bizalmat keltő, tágas, professzionális',
  Beauty: 'elegáns, prémium, letisztult',
  Fitness: 'energikus, erős, dinamikus',
  Technology: 'modern, letisztult, tech',
  Events: 'figyelemfelkeltő, ünnepi',
  Wedding: 'romantikus, elegáns, klasszikus',
  'E-commerce': 'bizalomkeltő, vásárlásra ösztönző',
  Marketing: 'magabiztos, eredményorientált',
  Corporate: 'visszafogott, szakértői',
  Automotive: 'erőteljes, prémium',
  Healthcare: 'nyugtató, tiszta, bizalomkeltő',
  Luxury: 'luxus, exkluzív, visszafogott',
  Gaming: 'dramatikus, sötét, energikus',
  Creator: 'személyes, karakteres',
};

const CATEGORY_SECTIONS: Record<string, string> = {
  Restaurant: 'étlap, nyitvatartás, asztalfoglalás',
  'Real Estate': 'kiemelt ingatlanok, szolgáltatások, kapcsolat',
  Beauty: 'szolgáltatások, árak, foglalás',
  Fitness: 'bérletek, órarend, edzők',
  Technology: 'funkciók, árazás, gyakori kérdések',
  Events: 'program, helyszín, jegyinformációk',
  Wedding: 'menetrend, helyszín, visszajelzés',
  'E-commerce': 'termékek, szállítás, garancia',
  Luxury: 'válogatott kollekció, márkatörténet, kapcsolat',
};

export function useTemplateSeed(): TemplateSeed {
  const [params] = useSearchParams();
  const { profile } = useAuth();

  return useMemo(() => {
    const raw = params.get('template');
    if (!raw) return { name: null, brief: '' };

    // The query carries name and category rather than an id, because a template
    // row can be deleted between the hall and here and a brief still works.
    const [name, category = 'Business'] = raw.split('|');
    const tone = CATEGORY_TONE[category] ?? 'professzionális, letisztult';
    const sections = CATEGORY_SECTIONS[category] ?? 'szolgáltatások, rólunk, kapcsolat';
    const who = profile?.full_name ? `${profile.full_name} vállalkozásának` : 'egy vállalkozás';

    return {
      name,
      brief: `Készíts egy ${category.toLowerCase()} jellegű, ${tone} stílusú weboldalt ${who} számára, „${name}” néven. Legyenek rajta ezek a részek: ${sections}.`,
    };
  }, [params, profile?.full_name]);
}

/** Preserves the chosen template when moving into the create flow. */
export function useTemplateHandoff() {
  const navigate = useNavigate();
  return (name: string, category: string) =>
    navigate(`/app/create?template=${encodeURIComponent(`${name}|${category}`)}`);
}
