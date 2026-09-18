import { useEffect, useMemo, useState } from 'react';
import { Download, Mail, Music2, Play, Pause, Sparkles, Loader2, Clock3, History, Disc3, Wand2, RefreshCw } from 'lucide-react';
import { CelticEmblem } from './CelticEmblem';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

const DURATIONS = [60, 120, 180, 240, 300];

export function MusicPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user, profile, isOwner } = useAuth();
  const [lyrics, setLyrics] = useState('');
  const [lyricsTheme, setLyricsTheme] = useState('');
  const [lyricsTitle, setLyricsTitle] = useState('');
  const [genre, setGenre] = useState('modern pop');
  const [mood, setMood] = useState('emotional, cinematic, uplifting');
  const [vocal, setVocal] = useState('warm male lead vocal');
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [title, setTitle] = useState('DESIGNLY AI Song');
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(false);
  const [library, setLibrary] = useState<Array<{ id: string; title: string; duration_seconds: number; audio_url: string; created_at: string }>>([]);
  const cost = useMemo(() => Math.ceil(duration / 60) * 100, [duration]);

  const generateLyricsLocally = () => {
    const theme = lyricsTheme.trim() || 'álmok és új kezdetek';
    const titleText = lyricsTitle.trim() || 'Új kezdet';
    const chorus = [
      `[chorus]`,
      `Veled indul el minden új nap,`,
      `a csendből is egy dallam fakad,`,
      `ha messze visz az út, én akkor is megyek,`,
      `mert bennünk élnek még a holnapok és a jelek.`,
    ];
    const verse1 = [
      `[verse]`,
      `Az éj fölöttünk lassan továbbhalad,`,
      `a város fénye őrzi a pillanatot,`,
      `a szívem azt súgja: ne nézz vissza már,`,
      `minden lépés egy új történetre vár.`,
    ];
    const verse2 = [
      `[verse]`,
      `A szél elviszi, amit tegnap féltem,`,
      `ma már bátran állok a saját reményem mellett,`,
      `ha el is rejtőzik néha a fény,`,
      `a hangod visszahív, és újra enyém a remény.`,
    ];
    const bridge = [
      `[bridge]`,
      `És ha egyszer minden út elcsendesül,`,
      `a dalunk akkor is velünk együtt lélegzik,`,
      `nem kell más, csak egy újabb pillanat,`,
      `hogy megtaláljuk egymásban a holnapot.`,
    ];
    const outro = [
      `[outro]`,
      `Új kezdet, új fény, új történet,`,
      `a szívünk viszi tovább az éneket.`,
    ];
    setTitle(titleText);
    setLyrics([
      `[intro]`,
      `Ez a dal ${theme} történetéről szól.`,
      '',
      ...verse1,
      '',
      ...chorus,
      '',
      ...verse2,
      '',
      ...bridge,
      '',
      ...chorus,
      '',
      ...outro,
    ].join('\n'));
    setError('');
  };

  const loadLibrary = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('music_generations')
      .select('id,title,duration_seconds,audio_url,created_at')
      .order('created_at', { ascending: false })
      .limit(12);
    setLibrary(data || []);
  };

  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase
      .from('music_generations')
      .select('id,title,duration_seconds,audio_url,created_at')
      .order('created_at', { ascending: false })
      .limit(12)
      .then(({ data }) => {
        if (active) setLibrary(data || []);
      });
    return () => { active = false; };
  }, [user?.id]);

  const generate = async () => {
    if (!user) { onNavigate('login'); return; }
    if (!lyrics.trim()) { setError('Írd be a dalszöveget.'); return; }
    if (!isOwner && (profile?.credits ?? 0) < cost) {
      setError('Ehhez a dalhoz ' + cost + ' kredit szükséges. Jelenlegi egyenleg: ' + (profile?.credits ?? 0) + '.'); return;
    }
    setLoading(true); setError(''); setAudioUrl(''); setPlaying(false);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!token || !baseUrl) throw new Error('Nincs aktív munkamenet.');
      const response = await fetch(baseUrl + '/functions/v1/music-generate', {
        method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, lyrics, genre, mood, vocal, duration }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'A zene generálása sikertelen.');
      setAudioUrl(data.audioUrl);
      await loadLibrary();
    } catch (e) { setError(e instanceof Error ? e.message : 'A zene generálása sikertelen.'); }
    finally { setLoading(false); }
  };

  const togglePlay = () => {
    const audio = document.getElementById('designly-audio') as HTMLAudioElement | null;
    if (!audio) return;
    if (audio.paused) { void audio.play(); setPlaying(true); } else { audio.pause(); setPlaying(false); }
  };

  const sendEmail = (url = audioUrl, songTitle = title) => {
    if (!url) return;
    const subject = encodeURIComponent('DESIGNLY AI dal – ' + songTitle);
    const body = encodeURIComponent('Elkészült a DESIGNLY AI dalom.\n\nLejátszás / letöltés:\n' + url + '\n\nA dalt a DESIGNLY STUDIO készítette.');
    window.location.href = 'mailto:?subject=' + subject + '&body=' + body;
  };

  return <div className="space-y-8">
    <section className="relative overflow-hidden rounded-2xl border border-gold-600/20 bg-ink-950/80 p-6 lg:p-8">
      <div className="absolute -right-16 -top-20 opacity-30 pointer-events-none"><CelticEmblem size={240} animate showD /></div>
      <div className="relative z-10 max-w-3xl">
        <div className="flex items-center gap-2 text-gold-300 text-[11px] uppercase tracking-[0.28em]"><Disc3 className="w-4 h-4" /> DESIGNLY CREATIVE AUDIO</div>
        <h1 className="font-display text-3xl lg:text-5xl text-cream-50 mt-3">AI Music Studio</h1>
        <p className="text-cream-300/60 mt-3 max-w-2xl leading-relaxed">Dalszöveg → zene → valódi énekes előadás. A kész mű WAV formátumban lejátszható, letölthető és megosztható e-mailben.</p>
      </div>
    </section>
    <section className="card-premium p-5 lg:p-7 border-gold-600/20 bg-gold-600/[0.03]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-gold-300 text-xs uppercase tracking-[0.24em]">
            <Wand2 className="w-4 h-4" /> DALSZÖVEG-GENERÁTOR
          </div>
          <h2 className="font-display text-2xl lg:text-3xl text-cream-100 mt-2">Készíts dalszöveget egyetlen lépéssel</h2>
          <p className="text-cream-400/60 mt-2 max-w-2xl">Írd meg a témát és a címet, a DESIGNLY pedig felépít egy azonnal szerkeszthető dalszöveg-vázlatot. Ez a generátor külön API-kulcs nélkül működik.</p>
        </div>
        <button onClick={generateLyricsLocally} className="btn-gold shrink-0 flex items-center justify-center gap-2">
          <Wand2 className="w-4 h-4" /> DALSZÖVEG GENERÁLÁSA
        </button>
      </div>
      <div className="grid md:grid-cols-2 gap-4 mt-5">
        <div>
          <label className="text-sm text-cream-200">Téma / történet</label>
          <input value={lyricsTheme} onChange={e => setLyricsTheme(e.target.value)} placeholder="pl. szerelem, szakítás, nyár, motiváció" className="input-premium mt-2 w-full" />
        </div>
        <div>
          <label className="text-sm text-cream-200">Dal címe</label>
          <input value={lyricsTitle} onChange={e => setLyricsTitle(e.target.value)} placeholder="pl. Új kezdet" className="input-premium mt-2 w-full" />
        </div>
      </div>
      <button type="button" onClick={() => { setLyrics(''); setLyricsTitle(''); setLyricsTheme(''); }} className="mt-3 text-xs text-cream-500/60 hover:text-gold-300 flex items-center gap-1">
        <RefreshCw className="w-3 h-3" /> Mezők törlése
      </button>
    </section>
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
      <div><div className="flex items-center gap-2 text-gold-300 text-xs uppercase tracking-[0.24em]"><Music2 className="w-4 h-4" /> SONG BUILDER</div><h2 className="font-display text-2xl lg:text-3xl text-cream-100 mt-2">Építsd fel a saját dalodat</h2><p className="text-cream-400/60 mt-2 max-w-2xl">A dalszöveg és a zenei irány alapján a rendszer komplett dalt készít énekkel.</p></div>
      <div className="chip border-gold-600/30 bg-gold-600/10 text-gold-200">{cost} kredit / {duration} mp</div>
    </div>
    <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
      <section className="card-premium p-5 lg:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-sm font-medium text-cream-200">Dalszöveg</label>
          <span className="inline-flex items-center gap-1.5 text-xs text-gold-300 border border-gold-600/20 bg-gold-600/10 rounded-full px-3 py-1">
            <Wand2 className="w-3.5 h-3.5" /> A kész dalszöveg szerkeszthető
          </span>
        </div>
        <p className="text-xs text-cream-400/60 mt-2">A generálás után a teljes szöveget szabadon átírhatod, javíthatod vagy kiegészítheted, mielőtt zenét készítesz belőle.</p>
        <textarea value={lyrics} onChange={e => setLyrics(e.target.value)} placeholder={'[verse]\nIde írd a verzét...\n\n[chorus]\nIde a refrént...\n\n[bridge]\n...'} className="mt-3 w-full min-h-[330px] rounded-xl border border-gold-600/15 bg-ink-950/70 text-cream-100 p-4 outline-none focus:border-gold-500/40 resize-y" />
        <p className="text-xs text-cream-500/60 mt-2">Használhatsz [intro], [verse], [chorus], [bridge], [outro] jelöléseket.</p>
      </section>
      <section className="card-premium p-5 lg:p-7 space-y-5">
        <div><label className="text-sm text-cream-200">Dal címe</label><input value={title} onChange={e => setTitle(e.target.value)} className="input-premium mt-2 w-full" /></div>
        <div><label className="text-sm text-cream-200">Műfaj</label><input value={genre} onChange={e => setGenre(e.target.value)} className="input-premium mt-2 w-full" /></div>
        <div><label className="text-sm text-cream-200">Hangulat</label><input value={mood} onChange={e => setMood(e.target.value)} className="input-premium mt-2 w-full" /></div>
        <div><label className="text-sm text-cream-200">Énekhang</label><input value={vocal} onChange={e => setVocal(e.target.value)} className="input-premium mt-2 w-full" /></div>
        <div><label className="text-sm text-cream-200">Hossz</label><div className="grid grid-cols-5 gap-2 mt-2">{DURATIONS.map(d => <button key={d} onClick={() => setDuration(d)} className={'rounded-lg py-2 text-xs border transition ' + (duration === d ? 'border-gold-500/50 bg-gold-600/15 text-gold-200' : 'border-gold-600/10 text-cream-400/70 hover:border-gold-600/30')}>{d / 60}p</button>)}</div></div>
        <button onClick={generate} disabled={loading} className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-50">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}{loading ? 'Zene készül…' : 'DAL GENERÁLÁSA · ' + cost + ' KREDIT'}</button>
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/5 text-red-200 text-sm p-3">{error}</div>}
      </section>
    </div>
    {audioUrl && <section className="card-premium p-5 lg:p-7"><div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div><div className="text-xs uppercase tracking-[0.2em] text-gold-300">Elkészült mű</div><h2 className="font-display text-2xl text-cream-100 mt-1">{title}</h2></div><div className="flex flex-wrap gap-2"><button onClick={togglePlay} className="btn-gold flex items-center gap-2">{playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />} Lejátszás</button><a href={audioUrl} download target="_blank" rel="noreferrer" className="btn-ghost flex items-center gap-2"><Download className="w-4 h-4" /> WAV letöltése</a><button onClick={sendEmail} className="btn-ghost flex items-center gap-2"><Mail className="w-4 h-4" /> Küldés e-mailben</button></div></div><div className="mt-5 rounded-xl border border-gold-600/10 bg-ink-950/70 p-4"><audio id="designly-audio" src={audioUrl} controls className="w-full music-audio" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} /></div><div className="mt-3 flex items-center gap-2 text-xs text-cream-500/60"><Clock3 className="w-3.5 h-3.5" /> A dal a DESIGNLY kredit-egyenlegből készült.</div></section>}
    {library.length > 0 && <section className="card-premium p-5 lg:p-7">
      <div className="flex items-center gap-2 mb-5">
        <History className="w-4 h-4 text-gold-400" />
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-gold-300">ZENEI KÖNYVTÁR</div>
          <h2 className="font-display text-2xl text-cream-100 mt-1">Korábbi műveid</h2>
        </div>
      </div>
      <div className="grid gap-3">
        {library.map(song => (
          <div key={song.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-gold-600/10 bg-ink-950/60 p-4">
            <div>
              <div className="text-sm text-cream-100">{song.title}</div>
              <div className="text-xs text-cream-500/60 mt-1">
                {Math.round(song.duration_seconds / 60 * 10) / 10} perc · {new Date(song.created_at).toLocaleDateString('hu-HU')}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={song.audio_url} download target="_blank" rel="noreferrer" className="btn-ghost text-xs px-4 py-2 flex items-center gap-2">
                <Download className="w-3.5 h-3.5" /> WAV
              </a>
              <button onClick={() => sendEmail(song.audio_url, song.title)} className="btn-ghost text-xs px-4 py-2 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" /> E-mail
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>}
  </div>;
}