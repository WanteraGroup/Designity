import { useRef, useState } from 'react';
import { Bell, Camera, Check, Globe, Lock, Mail, Phone, Save, Shield, Trash2, Upload, User } from 'lucide-react';
import { ForgedPanel, ForgedButton, NordicHeader } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

interface SettingsProps {
  onNavigate: (page: string) => void;
}

const AVATAR_BUCKET = 'designly-avatars';
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

export default function Settings({ onNavigate }: SettingsProps) {
  const { profile, user, isOwner, isAdmin, isUnlimited, refreshProfile } = useAuth();
  const { lang, setLang, languages } = useI18n();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const hu = lang === 'hu';
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(user?.email || profile?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [alerts, setAlerts] = useState(() => {
    try {
      return localStorage.getItem('designly_alerts') || 'System / Campaign / Agents';
    } catch {
      return 'System / Campaign / Agents';
    }
  });
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);
  const [savedNotifications, setSavedNotifications] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const text = {
    settings: hu ? 'Beállítások' : 'Settings',
    subtitle: hu ? 'Fiók és rendszerpreferenciák kezelése' : 'Manage account and system preferences',
    general: hu ? 'Általános' : 'General',
    profile: hu ? 'Profil' : 'Profile',
    fullName: hu ? 'Teljes név' : 'Full name',
    email: hu ? 'E-mail cím' : 'Email address',
    phone: hu ? 'Telefonszám' : 'Phone number',
    language: hu ? 'Nyelv' : 'Language',
    theme: hu ? 'Téma' : 'Theme',
    themeValue: 'Nordic Dark',
    save: hu ? 'Beállítások mentése' : 'Save Settings',
    notifications: hu ? 'Értesítések' : 'Notifications',
    alerts: hu ? 'Riasztások' : 'Alerts',
    notificationEmail: hu ? 'E-mail értesítések' : 'Email notifications',
    saveNotifications: hu ? 'Értesítések mentése' : 'Save Notifications',
  };

  const handleProfileSave = async () => {
    if (!profile || !user) return;
    setSavingProfile(true);
    setError(null);

    const nextEmail = email.trim().toLowerCase();
    if (!nextEmail || !nextEmail.includes('@')) {
      setError(hu ? 'Adj meg érvényes e-mail címet.' : 'Enter a valid email address.');
      setSavingProfile(false);
      return;
    }

    const emailChanged = nextEmail !== (user.email || '').toLowerCase();

    if (emailChanged) {
      const { error: authError } = await (await import('@/lib/supabase')).supabase.auth.updateUser({ email: nextEmail });
      if (authError) {
        setError(authError.message);
        setSavingProfile(false);
        return;
      }
    }

    const { supabase } = await import('@/lib/supabase');
    const { error: profileError } = await supabase.rpc('update_my_profile', {
      p_full_name: fullName.trim(),
      p_phone: phone.trim(),
      p_email: emailChanged ? nextEmail : null,
    });

    if (profileError) {
      setError(profileError.message);
    } else {
      await refreshProfile();
      setSavedProfile(true);
      window.setTimeout(() => setSavedProfile(false), 2500);
    }
    setSavingProfile(false);
  };

  const handleAvatarChange = async (file?: File) => {
    if (!profile || !file) return;
    setError(null);

    if (!file.type.startsWith('image/')) {
      setError(hu ? 'Csak képfájl tölthető fel.' : 'Only image files can be uploaded.');
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setError(hu ? 'A profilkép legfeljebb 5 MB lehet.' : 'The profile picture must be 5 MB or smaller.');
      return;
    }

    setUploadingAvatar(true);
    const { supabase } = await import('@/lib/supabase');
    const path = profile.id + '/avatar';

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, file, { cacheControl: '3600', contentType: file.type, upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      setUploadingAvatar(false);
      return;
    }

    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    const avatarUrl = data.publicUrl + '?v=' + Date.now();
    const { error: profileError } = await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', profile.id);

    if (profileError) {
      setError(profileError.message);
    } else {
      await refreshProfile();
      setSavedProfile(true);
      window.setTimeout(() => setSavedProfile(false), 2500);
    }
    setUploadingAvatar(false);
  };

  const removeAvatar = async () => {
    if (!profile) return;
    setUploadingAvatar(true);
    setError(null);
    const { supabase } = await import('@/lib/supabase');
    const { error: removeError } = await supabase.storage.from(AVATAR_BUCKET).remove([profile.id + '/avatar']);
    if (removeError) {
      setError(removeError.message);
      setUploadingAvatar(false);
      return;
    }
    const { error: profileError } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', profile.id);
    if (profileError) setError(profileError.message);
    else await refreshProfile();
    setUploadingAvatar(false);
  };

  const handleNotificationsSave = () => {
    try {
      localStorage.setItem('designly_alerts', alerts);
      localStorage.setItem('designly_email_notifications', emailNotifications ? 'true' : 'false');
    } catch {
      // Keep the interaction usable even when local storage is unavailable.
    }
    setSavingNotifications(true);
    window.setTimeout(() => {
      setSavingNotifications(false);
      setSavedNotifications(true);
      window.setTimeout(() => setSavedNotifications(false), 2200);
    }, 250);
  };

  return (
    <div className="relative min-h-screen bg-[#020505] text-[#E3FFFB] overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center opacity-[0.24]" style={{ backgroundImage: "url('/designly-odin-hall-bg.svg')" }} aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#020505]/35 to-[#020505]/95" aria-hidden="true" />

      <NordicHeader title="SETTINGS — SYSTEM SETTINGS" />

      <main className="relative z-10 px-6 lg:px-8 pt-12 lg:pt-16 pb-24 space-y-12 max-w-[1700px] mx-auto">
        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[9px] uppercase tracking-[.28em] text-[#D6B36A]/65">
                <Shield className="w-4 h-4" /> SYSTEM COMMAND
              </div>
              <h1 className="mt-2 font-serif text-4xl lg:text-5xl">{text.settings}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#EEE8DC]/55">{text.subtitle}</p>
            </div>
            <ForgedButton variant="secondary" onClick={() => onNavigate('dashboard')}>← Command</ForgedButton>
          </div>

          <ForgedPanel className="max-w-5xl">
            <div className="flex items-center gap-2 text-[#F5DFA3] mb-6">
              <User className="w-5 h-5" />
              <div className="font-serif text-2xl">{text.general}</div>
            </div>

            <div className="grid lg:grid-cols-[auto_1fr] gap-7">
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-28 h-28 rounded-2xl overflow-hidden border border-[#D6B36A]/30 bg-black/40 flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={fullName || 'Profile'} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-[#D6B36A]/35" />
                  )}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar} className="btn-ghost text-[10px]">
                    <Camera className="w-4 h-4" /> {uploadingAvatar ? '...' : 'KÉP VÁLASZTÁSA'}
                  </button>
                  {profile?.avatar_url && (
                    <button type="button" onClick={() => void removeAvatar()} disabled={uploadingAvatar} className="btn-ghost text-[10px] text-red-300/80">
                      <Trash2 className="w-4 h-4" /> TÖRLÉS
                    </button>
                  )}
                </div>
                <input ref={avatarInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.currentTarget.value = '';
                  void handleAvatarChange(file);
                }} />
              </div>

              <div className="grid md:grid-cols-2 gap-5 text-xs">
                <Field label={text.fullName} value={fullName} onChange={setFullName} />
                <Field label={text.phone} value={phone} onChange={setPhone} icon={Phone} />
                <div>
                  <label className="space-y-1 block">
                    <span className="text-[#EEE8DC]/70">{text.email}</span>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#EEE8DC]/35" />
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#071311]/75 border border-[#263636] rounded-[10px] pl-10 pr-3 py-2.5 text-xs text-[#E3FFFB] outline-none focus:border-[#9CEEE5]/40" />
                    </div>
                  </label>
                </div>
                <div>
                  <label className="space-y-1 block">
                    <span className="text-[#EEE8DC]/70">{text.language}</span>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#EEE8DC]/35" />
                      <select value={lang} onChange={(e) => setLang(e.target.value)} className="w-full bg-[#071311]/75 border border-[#263636] rounded-[10px] pl-10 pr-3 py-2.5 text-xs text-[#E3FFFB] outline-none focus:border-[#9CEEE5]/40">
                        {languages.map((language) => <option key={language.code} value={language.code}>{language.flag} {language.name}</option>)}
                      </select>
                    </div>
                  </label>
                </div>
                <div>
                  <span className="block text-[#EEE8DC]/70 text-xs mb-1">{text.theme}</span>
                  <div className="w-full rounded-[10px] border border-[#263636] bg-[#071311]/75 px-3 py-2.5 text-xs text-[#E3FFFB]">Nordic Dark · DESIGNLY Odin Hall</div>
                </div>
              </div>
            </div>

            {error && <div className="mt-5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

            <div className="mt-7 flex items-center gap-3">
              <ForgedButton variant="primary" onClick={() => void handleProfileSave()} disabled={savingProfile}>
                <Save className="w-4 h-4" /> {savingProfile ? 'MENTÉS…' : text.save}
              </ForgedButton>
              {savedProfile && <span className="flex items-center gap-1 text-sm text-emerald-300"><Check className="w-4 h-4" /> Elmentve</span>}
            </div>
          </ForgedPanel>
        </section>

        <section>
          <div className="mb-6">
            <div className="text-[9px] uppercase tracking-[.28em] text-[#9CEEE5]/60">NOTIFICATION CONTROL</div>
            <h2 className="mt-2 font-serif text-3xl lg:text-4xl">{text.notifications}</h2>
          </div>

          <ForgedPanel className="max-w-5xl">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-[#263636] bg-black/20 p-5">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[#D6B36A]/80" />
                  <div>
                    <div className="font-serif text-xl">{text.notificationEmail}</div>
                    <div className="text-xs text-[#EEE8DC]/40 mt-1">{email || '—'}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailNotifications((value) => !value)}
                  className={`mt-5 flex items-center justify-between w-full rounded-xl border px-4 py-3 transition-all ${emailNotifications ? 'border-[#D6B36A]/30 bg-[#D6B36A]/8' : 'border-[#263636] bg-black/10'}`}
                >
                  <span className="text-xs text-[#EEE8DC]/70">{emailNotifications ? 'E-mail alerts enabled' : 'E-mail alerts disabled'}</span>
                  <span className={`w-10 h-5 rounded-full relative transition-all ${emailNotifications ? 'bg-[#D6B36A]/70' : 'bg-[#263636]'}`}>
                    <span className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${emailNotifications ? 'left-6' : 'left-1'}`} />
                  </span>
                </button>
              </div>

              <div className="rounded-2xl border border-[#263636] bg-black/20 p-5">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-[#D6B36A]/80" />
                  <div>
                    <div className="font-serif text-xl">{text.alerts}</div>
                    <div className="text-xs text-[#EEE8DC]/40 mt-1">System / Campaign / Agents</div>
                  </div>
                </div>
                <input value={alerts} onChange={(e) => setAlerts(e.target.value)} className="mt-5 w-full bg-[#071311]/75 border border-[#263636] rounded-[10px] px-3 py-2.5 text-xs text-[#E3FFFB] placeholder:text-[#EEE8DC]/30 outline-none focus:border-[#9CEEE5]/40" placeholder="System / Campaign / Agents" />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <ForgedButton variant="primary" onClick={handleNotificationsSave} disabled={savingNotifications}>
                <Save className="w-4 h-4" /> {savingNotifications ? 'MENTÉS…' : text.saveNotifications}
              </ForgedButton>
              {savedNotifications && <span className="flex items-center gap-1 text-sm text-emerald-300"><Check className="w-4 h-4" /> Elmentve</span>}
            </div>
            <p className="mt-3 text-[11px] text-[#EEE8DC]/35">Az értesítési preferenciák ezen a kliensen kerülnek mentésre; külön szerveroldali notification-preferences tábla jelenleg nincs bekötve.</p>
          </ForgedPanel>
        </section>

        <section>
          <ForgedPanel className="max-w-5xl">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-[#D6B36A]/75 mt-0.5" />
              <div className="flex-1">
                <div className="text-[9px] uppercase tracking-[.22em] text-[#D6B36A]/60">PASSWORD & SECURITY</div>
                <div className="font-serif text-2xl mt-1">Jelszó és biztonság</div>
                <p className="mt-2 text-sm leading-7 text-[#EEE8DC]/45">A jelszó módosítása a külön biztonságos reset űrlapon történik.</p>
              </div>
              <ForgedButton variant="secondary" onClick={() => onNavigate('reset')}>Új jelszó</ForgedButton>
            </div>
          </ForgedPanel>
        </section>

        {(isOwner || isAdmin) && (
          <ForgedPanel className="max-w-5xl border-[#D6B36A]/20">
            <div className="text-[9px] uppercase tracking-[.22em] text-[#D6B36A]/60">ACCESS LEVEL</div>
            <div className="font-serif text-2xl mt-1">{isOwner ? 'OWNER' : 'ADMIN'}</div>
            <p className="mt-2 text-sm text-[#EEE8DC]/45">
              {isOwner ? 'Tulajdonosi hozzáférés; a végleges generálások és AI szerkesztések a saját kreditkeretet használják.' : 'Adminisztrációs hozzáférés és rendszerfelügyelet.'}
              {isUnlimited ? ' Final generations and AI editor actions use the owner's credit balance.' : ''}
            </p>
          </ForgedPanel>
        )}
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: typeof Phone;
}) {
  return (
    <label className="space-y-1 block">
      <span className="text-[#EEE8DC]/70">{label}</span>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#EEE8DC]/35" />}
        <input value={value} onChange={(event) => onChange(event.target.value)} className={`w-full bg-[#071311]/75 border border-[#263636] rounded-[10px] ${Icon ? 'pl-10' : 'px-3'} py-2.5 text-xs text-[#E3FFFB] placeholder:text-[#EEE8DC]/35 outline-none focus:border-[#9CEEE5]/40`} />
      </div>
    </label>
  );
}
