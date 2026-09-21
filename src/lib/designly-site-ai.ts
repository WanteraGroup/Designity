// DESIGNLY — AI website generator bridge.
// Takes a plain-language brief, runs the existing Designly Master Agent,
// and maps its buildSpec into the site engine's page/section schema.

import { runDesignlyMasterAgent } from './designly-agent';
import { newSection, type SitePage, type SiteSection, type SiteSpec } from './site-builder';

export interface SiteGenerationResult {
  ok: boolean;
  site?: SiteSpec;
  message?: string;
  activeAgents?: string[];
}

function toSection(raw: unknown, index: number): SiteSection {
  const s = (typeof raw === 'string' ? { title: raw } : (raw || {})) as Record<string, unknown>;
  const type = String(s.type || s.kind || s.block || '').toLowerCase();
  const known = ['hero', 'features', 'about', 'gallery', 'pricing', 'testimonials', 'faq', 'cta', 'contact', 'footer'];
  const resolved = known.includes(type) ? type : (index === 0 ? 'hero' : 'features');

  const base = newSection(resolved);
  return {
    ...base,
    title: String(s.title || s.heading || base.title || ''),
    body: String(s.body || s.description || s.text || base.body || ''),
    cta: s.cta ? String(s.cta) : base.cta,
    eyebrow: s.eyebrow ? String(s.eyebrow) : base.eyebrow,
    items: Array.isArray(s.items)
      ? (s.items as unknown[]).map((it) => {
          const o = (typeof it === 'string' ? { title: it } : (it || {})) as Record<string, unknown>;
          return { title: String(o.title || o.name || ''), body: String(o.body || o.description || '') };
        })
      : base.items,
    plans: Array.isArray(s.plans)
      ? (s.plans as unknown[]).map((it) => {
          const o = (it || {}) as Record<string, unknown>;
          return { name: String(o.name || ''), price: String(o.price || ''), body: String(o.body || '') };
        })
      : base.plans,
  };
}

function specFromBuildSpec(
  buildSpec: Record<string, unknown> | null,
  projectName: string,
  design: Record<string, unknown> | null,
): SiteSpec {
  const rawPages = Array.isArray(buildSpec?.pages) ? (buildSpec.pages as unknown[]) : [];
  const content = ((buildSpec && buildSpec.content) || {}) as Record<string, unknown>;

  const pages: SitePage[] = rawPages.length
    ? rawPages.map((p, i) => {
        const page = (p || {}) as Record<string, unknown>;
        const rawSections = Array.isArray(page.sections) ? (page.sections as unknown[]) : [];
        return {
          path: String(page.path || (i === 0 ? '/' : '/oldal-' + (i + 1))),
          title: String(page.title || page.name || projectName),
          sections: rawSections.map((s, si) => toSection(s, si)),
        };
      })
    : [
        {
          path: '/',
          title: projectName,
          sections: [
            { ...newSection('hero'), title: String(content.heroTitle || content.title || projectName), body: String(content.heroDescription || content.description || ''), cta: String(content.cta || 'Kapcsolatfelvetel') },
            newSection('features'),
            newSection('cta'),
          ],
        },
      ];

  pages.forEach((page) => {
    if (!page.sections.length) page.sections = [newSection('hero')];
  });

  const name = String((design && design.siteName) || content.siteName || content.title || projectName || 'Uj weboldal');
  return { name, pages };
}

export async function generateSiteWithAI(params: {
  brief: string;
  projectName?: string;
  brandKitId?: string | null;
  language?: string;
  onStatus?: (status: string) => void;
}): Promise<SiteGenerationResult> {
  const brief = params.brief.trim();
  if (brief.length < 5) {
    return { ok: false, message: 'Írj legalább néhány szót a weboldalról.' };
  }

  if (params.onStatus) params.onStatus('Az AI elemzi a briefet…');

  let result: Awaited<ReturnType<typeof runDesignlyMasterAgent>>;
  try {
    result = await runDesignlyMasterAgent({
      brief,
      brandKitId: params.brandKitId ?? null,
      requestedOutputs: ['website'],
      language: params.language || 'hu',
      mode: 'preview',
    });
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Az AI generálás közben hiba történt.' };
  }

  if (!result.success) {
    return { ok: false, message: result.message || 'Az AI nem tudta felépíteni a weboldalt.' };
  }

  if (params.onStatus) params.onStatus('Az oldal struktúrájának összeállítása…');

  const raw = result as unknown as Record<string, unknown>;
  const orchestration = (raw.orchestration || {}) as Record<string, unknown>;
  const buildSpec = (orchestration.buildSpec || raw.buildSpec || null) as Record<string, unknown> | null;
  const design = (orchestration.design || raw.design || null) as Record<string, unknown> | null;

  const site = specFromBuildSpec(buildSpec, params.projectName || 'Uj weboldal', design);

  if (params.onStatus) params.onStatus('Kész — az előnézet betölt.');

  return { ok: true, site, activeAgents: (result.activeAgents as string[]) || ['master'] };
}
