import { useState } from 'react';
import { ChevronDown, Send, Sparkles, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { askHuginn } from '@/lib/huginn-agent';


function RavenMark({ className = '', flipped = false, eyeClass = 'huginn-eye' }: { className?: string; flipped?: boolean; eyeClass?: string }) {
  return <svg className={`huginn-raven ${className}`} viewBox="0 0 100 72" aria-hidden="true">
    <defs><linearGradient id={flipped ? "muninnMetal" : "huginnMetal"} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f0d48a"/><stop offset=".45" stopColor="#b98a2f"/><stop offset="1" stopColor="#4b3514"/></linearGradient></defs>
    <g transform={flipped ? "translate(100 0) scale(-1 1)" : undefined}>
      <path className="huginn-wing" d="M45 38C28 15 17 12 5 9c10 13 15 24 29 34 5 4 8 3 11-5Z" fill="#111417" stroke={`url(#${flipped ? "muninnMetal" : "huginnMetal"})`} strokeWidth="1.4"/>
      <ellipse cx="55" cy="43" rx="25" ry="14" fill="#0b0d0f" stroke={`url(#${flipped ? "muninnMetal" : "huginnMetal"})`} strokeWidth="1.5"/>
      <circle cx="70" cy="27" r="11" fill="#0a0c0e" stroke={`url(#${flipped ? "muninnMetal" : "huginnMetal"})`} strokeWidth="1.4"/>
      <path d="M79 28l16 5-16 5z" fill="#18130a" stroke="#b98a2f" strokeWidth="1"/>
      <circle className={eyeClass} cx="73" cy="26" r="2.2" fill="#ffd56a"/>
      <path d="M39 48c8 12 19 17 30 16" fill="none" stroke="#17191b" strokeWidth="6" strokeLinecap="round"/>
    </g>
  </svg>;
}

function HuginnRaven({ className = '' }: { className?: string }) {
  return <RavenMark className={className} />;
}

function MuninnRaven({ className = '' }: { className?: string }) {
  return <RavenMark className={className} flipped eyeClass="muninn-eye" />;
}

interface HuginnAgentProps { onNavigate: (page: string) => void; }

type ChatMessage = { role: 'huginn' | 'user'; text: string };

const fallback = (message: string, lang: string): { text: string; action?: string } => {
  const m = message.toLowerCase();
  const hu = lang === 'hu';
  const pick = (text: string, action?: string) => ({ text, action });
  if (/ár|ára|árak|csomag|fizet|price|pricing|cost|preis|prix/.test(m)) return pick(hu ? 'Az Árazás résznél megtalálod a csomagokat és a krediteket. Megnyitom neked.' : 'You can find plans and credits in Pricing. I can open it for you.', 'pricing');
  if (/sablon|template|vorlage|modèle/.test(m)) return pick(hu ? 'A Sablonok résznél kategóriák és kész irányok közül választhatsz.' : 'Templates gives you ready-made creative directions and categories.', 'templates');
  if (/alkot|készít|weboldal|website|create|design/.test(m)) return pick(hu ? 'Az Alkotás oldalon indíthatod a projektet, az AI pedig segít a briefből kiindulni.' : 'Create is where you start a project; the AI can turn your brief into a design direction.', 'create');
  if (/zene|music/.test(m)) return pick(hu ? 'Az AI Zene külön műhelyként érhető el.' : 'AI Music is available as a dedicated studio.', 'music');
  if (/bejelent|belép|login|sign in/.test(m)) return pick(hu ? 'A Bejelentkezés gombbal beléphetsz, vagy a Regisztrációval új fiókot hozhatsz létre.' : 'Use Sign in to log in or Get Started to create an account.');
  return pick(hu ? 'Huginn vagyok, Odin hollója. Segítek eligazodni a DESIGNLY-ben: mondd el, mit szeretnél létrehozni, vagy kérdezz az AI eszközökről, sablonokról, árakról és a működésről.' : 'I am Huginn, Odin’s raven. I can guide you through DESIGNLY—ask about creating, AI tools, templates, pricing or how the studio works.');
};

export function HuginnAgent({ onNavigate }: HuginnAgentProps) {
  const { lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const welcome = lang === 'hu'
    ? 'Üdvözöllek. Huginn vagyok, Odin hollója. Segítek eligazodni a DESIGNLY-ben és megmutatom, hol találod, amit keresel.'
    : 'Welcome. I am Huginn, Odin’s raven. I can guide you through DESIGNLY and show you where to find what you need.';

  const send = async (text = input) => {
    const clean = text.trim();
    if (!clean || busy) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: clean }]);
    setBusy(true);
    const result = await askHuginn(clean, lang);
    const local = fallback(clean, lang);
    const reply = result.ok && result.reply ? result.reply : local.text;
    const action = result.ok ? result.action : local.action;
    setMessages((m) => [...m, { role: 'huginn', text: reply }]);
    setBusy(false);
    if (action) setTimeout(() => onNavigate(action), 250);
  };

  return (
    <div className={`huginn-agent ${open ? 'huginn-agent--open' : ''}`}>
      {open && (
        <section className="huginn-panel" aria-label="Huginn AI agent">
          <header className="huginn-header">
            <div className="huginn-dual-avatar" aria-label="Huginn és Muninn">
              <div className="huginn-dual-raven"><HuginnRaven /></div>
              <div className="muninn-dual-raven"><MuninnRaven /></div>
            </div>
            <div><strong>HUGINN · MUNINN</strong><span>{lang === 'hu' ? 'ODIN KÉT HOLLÓJA · AI ÜGYNÖKPÁR' : 'ODIN’S TWO RAVENS · AI AGENT DUO'}</span></div>
            <button onClick={() => setOpen(false)} aria-label="Close"><X /></button>
          </header>
          <div className="huginn-messages">
            <div className="huginn-bubble huginn-bubble--huginn">{welcome}</div>
            {messages.map((m, i) => <div key={i} className={`huginn-bubble huginn-bubble--${m.role}`}>{m.text}</div>)}
            {busy && <div className="huginn-typing"><i/><i/><i/></div>}
          </div>
          <div className="huginn-suggestions">
            {[
              lang === 'hu' ? 'Hogyan kezdjek bele?' : 'How do I start?',
              lang === 'hu' ? 'Mutasd az AI eszközöket' : 'Show AI tools',
              lang === 'hu' ? 'Milyen sablonok vannak?' : 'What templates are available?',
              lang === 'hu' ? 'Mennyibe kerül?' : 'How much does it cost?',
            ].map((q) => <button key={q} onClick={() => send(q)}>{q}</button>)}
          </div>
          <form className="huginn-input" onSubmit={(e) => { e.preventDefault(); send(); }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={lang === 'hu' ? 'Kérdezz Huginn-tól…' : 'Ask Huginn…'} maxLength={500} />
            <button disabled={busy || !input.trim()} aria-label="Send"><Send /></button>
          </form>
        </section>
      )}
      <button className="huginn-orb" onClick={() => setOpen((v) => !v)} aria-label="Huginn és Muninn AI agentek">
        {open ? <ChevronDown /> : (
          <>
            <span className="huginn-orb-ravens"><HuginnRaven /><MuninnRaven /></span>
            <span><b>HUGINN</b><small>+ MUNINN · AI</small></span>
            <Sparkles />
          </>
        )}
      </button>
    </div>
  );
}
