import { supabase } from './supabase';

export interface DesignEditorState {
  heroTitle: string;
  heroDescription: string;
  heroButton: string;
  accent: string;
  surface: string;
  text: string;
  heroAlign: 'left' | 'center' | 'right';
  galleryColumns: 2 | 3 | 4;
  celticBorder: boolean;
  atmosphere: 'clean' | 'mist' | 'glow';
}

export interface DesignEditorChange {
  target: keyof DesignEditorState;
  value: string | boolean | number;
}

export interface DesignEditorResult {
  ok: boolean;
  provider?: 'groq';
  model?: string;
  reply?: string;
  changes?: DesignEditorChange[];
  design?: DesignEditorState;
  usage?: Record<string, unknown> | null;
  error?: string;
  message?: string;
  providerNotConfigured?: boolean;
}

export async function runDesignlyGroqEditor(params: {
  command: string;
  mode?: 'preview' | 'final';
  approvedChanges?: DesignEditorChange[];
  selectedElement?: string | null;
  device?: 'desktop' | 'tablet' | 'mobile';
  design: DesignEditorState;
}): Promise<DesignEditorResult> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      return { ok: false, error: 'NO_SESSION', message: 'A szerkesztő használatához be kell jelentkezni.' };
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const response = await fetch(`${supabaseUrl}/functions/v1/designly-editor-ai`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false,
        error: result.error || 'EDITOR_AI_FAILED',
        message: result.message || 'Az AI szerkesztő nem tudott válaszolni.',
        providerNotConfigured: result.providerNotConfigured,
      };
    }

    return result as DesignEditorResult;
  } catch {
    return {
      ok: false,
      error: 'NETWORK_ERROR',
      message: 'Nem sikerült elérni a DESIGNLY AI szerkesztőt.',
    };
  }
}
