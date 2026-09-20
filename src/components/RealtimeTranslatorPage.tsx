import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Languages, Mic, MicOff, Volume2, VolumeX, Radio } from 'lucide-react';

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: any) => void) | null;
};

function getRecognitionCtor(): (new () => Recognition) | null {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

const LANGS: Record<string, string> = {
  'hu-HU': 'Magyar',
  'en-US': 'English',
  'de-DE': 'Deutsch',
  'fr-FR': 'Français',
  'it-IT': 'Italiano',
  'es-ES': 'Español',
};

async function translateText(text: string, source: string, target: string): Promise<string> {
  const sourceCode = source.slice(0, 2);
  const targetCode = target.slice(0, 2);
  const response = await fetch(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(sourceCode + '|' + targetCode)}`,
    { headers: { Accept: 'application/json' } },
  );
  if (!response.ok) throw new Error('TRANSLATION_FAILED');
  const payload = await response.json();
  const translated = payload?.responseData?.translatedText;
  if (!translated) throw new Error('TRANSLATION_EMPTY');
  return String(translated);
}

export function RealtimeTranslatorPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const recognitionRef = useRef<Recognition | null>(null);
  const [source, setSource] = useState('hu-HU');
  const [target, setTarget] = useState('en-US');
  const [listening, setListening] = useState(false);
  const [speakOutput, setSpeakOutput] = useState(true);
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [status, setStatus] = useState('Valós idejű fordításra kész.');
  const [supported, setSupported] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSupported(Boolean(getRecognitionCtor()));
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const speak = (text: string) => {
    if (!speakOutput || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = target;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const processFinal = async (text: string) => {
    if (!text.trim()) return;
    setBusy(true);
    setStatus('Fordítás…');
    try {
      const result = await translateText(text.trim(), source, target);
      setTranslatedText(result);
      setStatus('Fordítás kész.');
      speak(result);
    } catch {
      setStatus('A fordító szolgáltatás nem válaszolt.');
    } finally {
      setBusy(false);
    }
  };

  const start = () => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      setStatus('A böngésző nem támogatja a Web Speech API-t.');
      return;
    }
    recognitionRef.current?.stop();
    const recognition = new Ctor();
    recognition.lang = source;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let full = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) full += event.results[i]?.[0]?.transcript || '';
      if (full.trim()) {
        setSourceText(full.trim());
        const lastIndex = event.results.length - 1;
        if (event.results[lastIndex]?.isFinal) void processFinal(full.trim());
      }
    };
    recognition.onerror = (event) => {
      setListening(false);
      setStatus(event?.error === 'not-allowed' ? 'A mikrofon engedélyezése szükséges.' : 'A hangfelismerés hibával leállt.');
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    setStatus('Élő hallgatás…');
    recognition.start();
  };

  const stop = () => {
    recognitionRef.current?.stop();
    setListening(false);
    setStatus('Élő hallgatás leállítva.');
  };

  const swap = () => {
    setSource(target);
    setTarget(source);
    setSourceText('');
    setTranslatedText('');
  };

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-gold-500/20 bg-gradient-to-br from-ink-900 via-[#0a0c0e] to-black p-7 lg:p-10">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[.28em] text-gold-300"><Radio className="h-4 w-4" /> VEYRA TRANSLATOR CAPABILITY</div>
            <h1 className="mt-3 text-4xl font-display font-bold text-cream-50 lg:text-5xl">Realtime Translator Agent</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-cream-300/60">Mikrofon → beszédfelismerés → automatikus fordítás → válasz felolvasása. Nem Google Translatere épül.</p>
          </div>
          <button onClick={() => onNavigate('agents')} className="btn-ghost text-xs"><ArrowLeft className="h-4 w-4" /> Agent Hub</button>
        </div>
      </section>
      <section className="card-lux p-6">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-end">
          <label className="label-lux">Forrásnyelv
            <select value={source} onChange={(e) => setSource(e.target.value)} className="input-lux mt-2">{Object.entries(LANGS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>
          </label>
          <button onClick={swap} className="btn-ghost text-xs"><Languages className="h-4 w-4" /> Csere</button>
          <label className="label-lux">Célnyelv
            <select value={target} onChange={(e) => setTarget(e.target.value)} className="input-lux mt-2">{Object.entries(LANGS).filter(([id]) => id !== source).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>
          </label>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-gold-600/10 bg-black/20 p-5"><div className="text-[9px] uppercase tracking-[.2em] text-cream-300/35">ÉLŐ BESZÉD</div><div className="mt-3 min-h-36 text-sm leading-7 text-cream-100">{sourceText || 'A beszéd szövege itt jelenik meg.'}</div></div>
          <div className="rounded-2xl border border-gold-500/20 bg-gold-500/5 p-5"><div className="text-[9px] uppercase tracking-[.2em] text-gold-300/55">FORDÍTÁS</div><div className="mt-3 min-h-36 text-sm leading-7 text-cream-100">{translatedText || 'A fordítás itt jelenik meg.'}</div></div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button onClick={listening ? stop : start} className="btn-gold text-sm" disabled={!supported || busy}>{listening ? <><MicOff className="h-4 w-4" /> Állj</> : <><Mic className="h-4 w-4" /> Élő fordítás indítása</>}</button>
          <button onClick={() => setSpeakOutput((v) => !v)} className="btn-ghost text-xs">{speakOutput ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />} Felolvasás {speakOutput ? 'BE' : 'KI'}</button>
          <span className="chip border-gold-500/15 bg-black/20 text-cream-300/55 text-[10px]">{status}</span>
        </div>
      </section>
      {!supported && <div className="card-lux border-red-500/20 p-5 text-sm text-red-200">A jelenlegi böngésző nem biztosít Web Speech API hangfelismerést. Chromium-alapú böngészőben HTTPS-kapcsolat és mikrofonengedély szükséges.</div>}
    </div>
  );
}
