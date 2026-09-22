// designly-export-pdf — server-side PDF rendering via PDFMonkey.
//
// The PDFMonkey key stays in this function's secret store. The client sends a
// template id and a flat payload; it never holds the provider credential.
//
// The payload is flattened on the client (src/lib/export-pdf.ts) because
// PDFMonkey fills template fields by exact key match and a nested object is a
// silently blank field — flattening where the document shape is known is less
// error-prone than re-deriving it here.

import { adminClient, json, preflight, resolveUserId } from '../_shared/agent.ts';

interface Body {
  template_id?: string;
  payload?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabase = adminClient();
  const { userId, error: authError } = await resolveUserId(req, supabase);
  if (authError) return json({ error: 'Invalid session' }, 401);
  if (!userId) return json({ error: 'Sign in to export a PDF' }, 401);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const templateId = (body.template_id ?? '').trim();
  if (!templateId) {
    return json(
      { error: 'No PDF template configured. Set system_settings.pdfmonkey_template_id.' },
      400,
    );
  }

  const payload = body.payload;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return json({ error: 'payload must be a flat JSON object' }, 400);
  }

  const apiKey = Deno.env.get('PDFMONKEY_API_KEY');
  if (!apiKey) {
    return json({ error: 'PDFMONKEY_API_KEY is not set on this function' }, 500);
  }

  try {
    const res = await fetch('https://api.pdfmonkey.io/api/v1/documents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        document: {
          document_template_id: templateId,
          payload,
          status: 'pending',
          meta: { user_id: userId },
        },
      }),
    });

    const result = (await res.json().catch(() => ({}))) as {
      document?: { id?: string; download_url?: string; status?: string };
      errors?: unknown;
    };

    if (!res.ok) {
      return json({ error: 'PDFMonkey rejected the document', detail: result.errors ?? null }, 502);
    }

    const document = result.document ?? {};

    // A queued document has no download_url yet. Returning an empty url would
    // look like a successful export that produces nothing, so the caller is
    // told to poll instead — and 202 says so at the HTTP level too.
    if (!document.download_url) {
      return json(
        {
          document_id: document.id ?? '',
          status: document.status ?? 'pending',
          error: 'The PDF is still rendering — poll this document id for the file.',
        },
        202,
      );
    }

    return json({ document_id: document.id ?? '', url: document.download_url });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('designly-export-pdf failed', message);
    return json({ error: message }, 500);
  }
});
