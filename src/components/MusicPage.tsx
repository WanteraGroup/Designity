import { useMemo, useState } from 'react';
import { Download, Mail, Music2, Play, Pause, Sparkles, Loader2, Clock3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

const DURATIONS = [60, 120, 180, 240, 300];

export function MusicPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user, profile, isOwner } = useAuth();
  const [lyrics, setLyrics] = useState('');
  const [genre, setGenre] = useState('modern pop');
  const [mood, setMood] = useState('emotional, cinematic, uplifting');
  const [vocal, setVocal] = useState('warm male lead vocal');
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [title, setTitle] = useState('DESIGNLY AI Song');
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(false);
  const cost = useMemo(() => Math.ceil(duration / 60) * 100, [duration]);

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
    } catch (e) { setError(e instanceof Error ? e.message : 'A zene generálása sikertelen.'); }
    finally { setLoading(false); }
  };

  const togglePlay = () => {
    const audio = document.getElementById('designly-audio') as HTMLAudioElement | null;
    if (!audio) return;
    if (audio.paused) { void audio.play(); setPlaying(true); } else { audio.pause(); setPlaying(false); }
  };

  const sendEmail = () => {
    if (!audioUrl) return;
    const subject = encodeURIComponent('DESIGNLY AI dal – ' + title);
    const body = encodeURIComponent('Elkészült a DESIGNLY AI dalom.\n\nLejátszás / letöltés:\n' + audioUrl + '\n\nA dalt a DESIGNLY STUDIO készítette.');
    window.location.href = 'mailto:?subject=' + subject + '&body=' + body;
  };

  return <div className="space-y-8">
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
      <div><div className="flex items-center gap-2 text-gold-300 text-xs uppercase tracking-[0.24em]"><Music2 className="w-4 h-4" /> AI Music Studio</div><h1 className="font-display text-3xl lg:text-4xl text-cream-100 mt-2">Dalszöveg + zene + ének</h1><p className="text-cream-400/60 mt-2 max-w-2xl">A saját dalszövegedből komplett, énekes AI-dalt készíthetsz. A kész WAV fájl lejátszható és letölthető.</p></div>
      <div className="chip border-gold-600/30 bg-gold-600/10 text-gold-200">{cost} kredit / {duration} mp</div>
    </div>
    <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
      <section className="card-premium p-5 lg:p-7"><label className="text-sm text-cream-200">Dalszöveg</label><textarea value={lyrics} onChange={e => setLyrics(e.target.value)} placeholder={'[verse]\nIde írd a verzét...\n\n[chorus]\nIde a refrént...\n\n[bridge]\n...'} className="mt-2 w-full min-h-[330px] rounded-xl border border-gold-600/15 bg-ink-950/70 text-cream-100 p-4 outline-none focus:border-gold-500/40 resize-y" /><p className="text-xs text-cream-500/60 mt-2">Használhatsz [intro], [verse], [chorus], [bridge], [outro] jelöléseket.</p></section>
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
    {audioUrl && <section className="card-premium p-5 lg:p-7"><div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div><div className="text-xs uppercase tracking-[0.2em] text-gold-300">Elkészült mű</div><h2 className="font-display text-2xl text-cream-100 mt-1">{title}</h2></div><div className="flex flex-wrap gap-2"><button onClick={togglePlay} className="btn-gold flex items-center gap-2">{playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />} Lejátszás</button><a href={audioUrl} download target="_blank" rel="noreferrer" className="btn-ghost flex items-center gap-2"><Download className="w-4 h-4" /> WAV letöltése</a><button onClick={sendEmail} className="btn-ghost flex items-center gap-2"><Mail className="w-4 h-4" /> Küldés e-mailben</button></div></div><div className="mt-5 rounded-xl border border-gold-600/10 bg-ink-950/70 p-4"><audio id="designly-audio" src={audioUrl} controls className="w-full" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} /></div><div className="mt-3 flex items-center gap-2 text-xs text-cream-500/60"><Clock3 className="w-3.5 h-3.5" /> A dal a DESIGNLY kredit-egyenlegből készült.</div></section>}
  </div>;
}