import { useCallback, useRef, useState } from 'react';
import { ai } from '@/lib/ai';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

/**
 * Drives the three-stage create flow. Holds the brief, the plan and the built
 * document so a refinement can re-enter at the right stage instead of
 * regenerating from the brief.
 */
export type Stage = 'brief' | 'plan' | 'building' | 'ready' | 'failed';

export interface PlanState {
  title?: string;
  summary?: string;
  project_type?: string;
  style?: string;
  palette?: string[];
  sections?: string[];
  copy?: { headline?: string; subheadline?: string; body?: string; cta?: string };
  tone?: string;
  notes?: string;
}

export function useCreateFlow() {
  const { session } = useAuth();
  const { lang } = useI18n();
  const [stage, setStage] = useState<Stage>('brief');
  const [plan, setPlan] = useState<PlanState | null>(null);
  const [document, setDocument] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creditsCharged, setCreditsCharged] = useState(0);
  const inFlight = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    inFlight.current?.abort();
    inFlight.current = null;
    setStage('brief');
  }, []);

  const generate = useCallback(
    async (brief: string) => {
      inFlight.current?.abort();
      const ctrl = new AbortController();
      inFlight.current = ctrl;

      setError(null);
      setStage('plan');

      try {
        const polished = await ai.polish(brief, lang, session?.access_token, ctrl.signal);
        const nextPlan = polished.document as PlanState;
        setPlan(nextPlan);

        setStage('building');
        const built = await ai.buildSite(
          nextPlan as Record<string, unknown>,
          session?.access_token,
          ctrl.signal,
        );

        setDocument(built.document);
        setCreditsCharged((c) => c + built.creditsCharged);
        setStage('ready');
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        setError((e as Error).message);
        setStage('failed');
      } finally {
        inFlight.current = null;
      }
    },
    [lang, session?.access_token],
  );

  const refine = useCallback(
    async (instruction: string) => {
      if (!document) return;
      inFlight.current?.abort();
      const ctrl = new AbortController();
      inFlight.current = ctrl;

      setError(null);
      try {
        const edited = await ai.edit(
          document,
          instruction,
          lang,
          session?.access_token,
          ctrl.signal,
        );
        setDocument(edited.document);
        setCreditsCharged((c) => c + edited.creditsCharged);
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        setError((e as Error).message);
      } finally {
        inFlight.current = null;
      }
    },
    [document, lang, session?.access_token],
  );

  return { stage, plan, document, error, creditsCharged, generate, refine, cancel, setDocument };
}
