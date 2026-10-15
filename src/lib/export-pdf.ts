/**
 * PDF export via PDFMonkey.
 *
 * The browser can only print a page to PDF through the user's own dialog, and
 * a print dialog cannot be driven from code. PDFMonkey renders server-side, so
 * the export is a real file the user receives rather than a print preview.
 *
 * A `document_template_id` is not created here — templates are authored in the
 * PDFMonkey account, and the id is stored in `system_settings.pdfmonkey_template_id`
 * so it can be swapped without a deploy. Until that row is set, the caller is
 * told the export is not configured rather than handed a broken request.
 */

import { supabase } from '@/lib/supabase';
import type { SiteDocument } from '@/lib/site-schema';

export interface PdfExportResult {
  url: string;
  documentId: string;
}

export class PdfNotConfiguredError extends Error {
  constructor() {
    super(
      'PDF export is not configured yet. Set system_settings.pdfmonkey_template_id to a PDFMonkey template id.',
    );
    this.name = 'PdfNotConfiguredError';
  }
}

/**
 * Flattens the site document into the flat key set PDFMonkey templates expect.
 *
 * PDFMonkey fills template fields by exact key match, so a nested object is a
 * silently blank field. Sections are therefore joined into single strings and
 * each block gets its own prefixed keys rather than a nested tree.
 */
export function toPdfPayload(doc: SiteDocument): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    title: doc.site.title,
    language: doc.site.language,
    mode: doc.site.theme.mode,
    primary_color: doc.site.theme.palette[0] ?? '#c49a2e',
    secondary_color: doc.site.theme.palette[1] ?? '',
    heading_font: doc.site.theme.heading_font,
    body_font: doc.site.theme.body_font,
    nav: doc.site.nav.map((n) => n.label).join(' · '),
    section_count: doc.blocks.length,
    generated_at: new Date().toISOString(),
  };

  doc.blocks.forEach((block, i) => {
    // One-based so template authors write hero_headline, not block0_headline.
    const n = i + 1;
    payload[`block${n}_type`] = block.type;

    switch (block.type) {
      case 'hero':
      case 'cta':
        payload[`block${n}_headline`] = block.headline;
        payload[`block${n}_subheadline`] = block.subheadline;
        payload[`block${n}_cta`] = block.cta.label;
        break;
      case 'features':
        payload[`block${n}_heading`] = block.heading;
        payload[`block${n}_items`] = block.items.map((it) => `${it.title} — ${it.text}`).join('\n');
        break;
      case 'about':
      case 'footer':
        payload[`block${n}_heading`] = 'heading' in block ? block.heading : '';
        payload[`block${n}_body`] = 'body' in block ? block.body : block.text;
        break;
      case 'services':
        payload[`block${n}_heading`] = block.heading;
        payload[`block${n}_items`] = block.items
          .map((it) => `${it.name} — ${it.price} — ${it.text}`)
          .join('\n');
        break;
      case 'gallery':
        payload[`block${n}_heading`] = block.heading;
        payload[`block${n}_items`] = block.images.map((im) => im.caption || im.query).join('\n');
        break;
      case 'testimonials':
        payload[`block${n}_heading`] = block.heading;
        payload[`block${n}_items`] = block.items
          .map((it) => `“${it.quote}” — ${it.author}`)
          .join('\n');
        break;
      case 'pricing':
        payload[`block${n}_heading`] = block.heading;
        payload[`block${n}_items`] = block.tiers
          .map((t) => `${t.name} — ${t.price} ${t.period}`)
          .join('\n');
        break;
      case 'faq':
        payload[`block${n}_heading`] = block.heading;
        payload[`block${n}_items`] = block.items.map((it) => `${it.q} — ${it.a}`).join('\n');
        break;
      case 'contact':
        payload[`block${n}_heading`] = block.heading;
        payload[`block${n}_body`] = block.body;
        payload[`block${n}_contact`] = [block.email, block.phone, block.address]
          .filter(Boolean)
          .join(' · ');
        break;
    }
  });

  return payload;
}

/** Resolves the configured template id, or throws a named error if unset. */
export async function pdfTemplateId(): Promise<string> {
  const { data } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'pdfmonkey_template_id')
    .maybeSingle();

  const value = data?.value;
  const id = typeof value === 'string' ? value : '';
  if (!id) throw new PdfNotConfiguredError();
  return id;
}

/**
 * Generates the PDF and returns its download URL.
 * Runs through the Supabase function so the PDFMonkey key stays server-side.
 */
export async function exportPdf(
  doc: SiteDocument,
  accessToken?: string,
): Promise<PdfExportResult> {
  const templateId = await pdfTemplateId();

  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/designly-export-pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ template_id: templateId, payload: toPdfPayload(doc) }),
  });

  const body = (await res.json().catch(() => ({}))) as {
    url?: string;
    document_id?: string;
    error?: string;
  };

  if (!res.ok || !body.url) {
    throw new Error(body.error ?? `PDF export failed (${res.status})`);
  }

  return { url: body.url, documentId: body.document_id ?? '' };
}
