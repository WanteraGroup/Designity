import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Mic, MicOff, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { askHuginn } from '@/lib/huginn-agent';

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: any) => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function VoiceAgentPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [language, setLanguage] = useState('hu-HU');
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState('Készen állok a hangalapú beszélgetésre.');
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(Boolean(getSpeechRecognition()));
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const speak = (text: string) => {
    if (!speaking || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const ask = async (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    setStatus('HUGINN feldolgozza a kérést…');
    const languageCode = language.startsWith('hu') ? 'hu' : language.startsWith('de') ? 'de' : language.startsWith('fr') ? 'fr' : 'en';
    const result = await askHuginn(clean, languageCode);
    const answer = result.ok && result.reply
      ? result.reply
      : 'A hangalapú kapcsolat jelenleg nem érhető el. Ellenőrizd a DESIGNLY AI kapcsolatot, majd próbáld újra.';
    setReply(answer);
    setStatus('Válasz elkészült.');
    speak(answer);
  };

  const startListening = () => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      setSupported(false);
      setStatus('A böngésző nem támogatja a Web Speech API hangfelismerést.');
      return;
    }

    recognitionRef.current?.stop();
    const recognition = new Ctor();
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const value = event.results[i]?.[0]?.transcript || '';
        if (event.results[i]?.isFinal) finalText += value;
        else interimText += value;
      }
      setTranscript((prev) => finalText ? finalText.trim() : (interimText || prev));
      if (finalText.trim()) void ask(finalText.trim());
    };
    recognition.onerror = (event) => {
      setListening(false);
      setStatus(event?.error === 'not-allowed' ? 'A mikrofon engedélyezése szükséges.' : 'A hangfelismerés hibával leállt.');
    };
    recognition.onend = () => {
      setListening(false);
      setStatus('Készen állok a következő kérdésre.');
    };
    recognitionRef.current = recognition;
    setListening(true);
    setStatus('Hallgatlak…');
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
    setStatus('Hallgatás leállítva.');
  };

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-gold-500/20 bg-gradient-to-br from-ink-900 via-[#0a0c0e] to-black p-7 lg:p-10">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gold-500/8 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[.28em] text-gold-300"><Sparkles className="h-4 w-4" /> VYRON VOICE CAPABILITY</div>
            <h1 className="mt-3 text-4xl font-display font-bold text-cream-50 lg:text-5xl">Voice Agent</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-cream-300/60">Beszélj a DESIGNLY-vel a mikrofonon keresztül. A beszédet Huginn kapja meg, a választ pedig a böngésző felolvassa.</p>
          </div>
          <button onClick={() => onNavigate('agents')} className="btn-ghost text-xs"><ArrowLeft className="h-4 w-4" /> Agent Hub</button>
        </div>
      </section>
      <section className="grid gap-5 lg:grid-cols-2">
        <div className="card-lux p-6">
          <div className="flex items-center justify-between gap-3">
            <div><div className="text-[9px] uppercase tracking-[.24em] text-gold-300/60">MIKROFON</div><h2 className="mt-1 text-xl font-display text-cream-50">Hangvezérlés</h2></div>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="input-lux w-auto text-xs">
              <option value="hu-HU">Magyar</option><option value="en-US">English</option><option value="de-DE">Deutsch</option><option value="fr-FR">Français</option>
            </select>
          </div>
          <div className="mt-7 flex min-h-48 flex-col items-center justify-center rounded-2xl border border-gold-600/10 bg-black/20 p-6 text-center">
            <div className={'grid h-24 w-24 place-items-center rounded-full border ' + (listening ? 'border-gold-300/70 bg-gold-400/15 shadow-[0_0_45px_rgba(211,170,76,.22)]' : 'border-gold-500/25 bg-gold-500/5')}>
              {listening ? <Mic className="h-9 w-9 text-gold-200" /> : <MicOff className="h-9 w-9 text-gold-400/55" />}
            </div>
            <div className="mt-5 text-sm font-medium text-cream-100">{status}</div>
            <button onClick={listening ? stopListening : startListening} className="btn-gold mt-5 text-sm" disabled={!supported}>
              {listening ? <><MicOff className="h-4 w-4" /> Hallgatás leállítása</> : <><Mic className="h-4 w-4" /> Beszéd indítása</>}
            </button>
          </div>
          <div className="mt-5 flex items-center justify-between rounded-xl border border-gold-600/10 bg-black/15 p-3">
            <div className="text-xs text-cream-300/55">Válasz felolvasása</div>
            <button onClick={() => setSpeaking((v) => !v)} className="chip border-gold-500/20 bg-gold-500/5 text-gold-200">
              {speaking ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />} {speaking ? 'BE' : 'KI'}
            </button>
          </div>
        </div>
        <div className="card-lux p-6">
          <div className="text-[9px] uppercase tracking-[.24em] text-gold-300/60">BESZÉD → AI</div>
          <h2 className="mt-1 text-xl font-display text-cream-50">Aktuális párbeszéd</h2>
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-gold-600/10 bg-black/20 p-4"><div className="text-[9px] uppercase tracking-[.18em] text-cream-300/35">TE</div><p className="mt-2 text-sm leading-7 text-cream-100">{transcript || 'Még nem hangzott el kérdés.'}</p></div>
            <div className="rounded-2xl border border-gold-500/20 bg-gold-500/5 p-4"><div className="text-[9px] uppercase tracking-[.18em] text-gold-300/60">HUGINN</div><p className="mt-2 text-sm leading-7 text-cream-100">{reply || 'HUGINN válasza itt jelenik meg.'}</p></div>
          </div>
        </div>
      </section>
      {!supported && <div className="card-lux border-red-500/20 p-5 text-sm text-red-200">A jelenlegi böngésző nem biztosít Web Speech API hangfelismerést. Chromium-alapú böngészőben HTTPS-kapcsolat és mikrofonengedély szükséges.</div>}
    </div>
  );
}
