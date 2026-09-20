import { useRef, useState } from 'react';
import { User, Mail, Globe, Shield, Check, Phone, CreditCard, Camera, Upload, Trash2, Lock, Save } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

interface SettingsPageProps {
  onNavigate: (page: string) => void;
}

const AVATAR_BUCKET = 'designly-avatars';
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

export function SettingsPage({ onNavigate }: SettingsPageProps) {
  const { profile, user, isOwner, isAdmin, isUnlimited, refreshProfile } = useAuth();
  const { lang, setLang, languages } = useI18n();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(user?.email || profile?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hu = lang === 'hu';
  const text = {
    profile: hu ? 'Profil' : 'Profile',
    profileSubtitle: hu ? 'Fiók- és személyes adatok kezelése' : 'Manage your account and personal details',
    fullName: hu ? 'Teljes név' : 'Full name',
    email: hu ? 'E-mail cím' : 'Email address',
    phone: hu ? 'Telefonszám' : 'Phone number',
    avatar: hu ? 'Profilkép' : 'Profile picture',
    choose: hu ? 'KÉP VÁLASZTÁSA' : 'CHOOSE IMAGE',
    upload: hu ? 'FELTÖLTÉS' : 'UPLOAD',
    remove: hu ? 'TÖRLÉS' : 'REMOVE',
    credits: hu ? 'Kredit egyenleg' : 'Credit balance',
    plan: hu ? 'Csomag' : 'Plan',
    changePlan: hu ? 'Csomag módosítása' : 'Change plan',
    save: hu ? 'Mentés' : 'Save',
    saving: hu ? 'Mentés…' : 'Saving…',
    saved: hu ? 'Elmentve' : 'Saved',
    password: hu ? 'Jelszó és biztonság' : 'Password & security',
    resetPassword: hu ? 'ÚJ JELSZÓ BEÁLLÍTÁSA' : 'SET NEW PASSWORD',
    emailNote: hu ? 'Az e-mail cím módosítása megerősítő levelet küldhet az új címre.' : 'Changing the email may require confirmation at the new address.',
    avatarNote: hu ? 'PNG, JPG vagy WebP · maximum 5 MB' : 'PNG, JPG or WebP · maximum 5 MB',
    role: hu ? 'Szerepkör' : 'Role',
  };

  const handleSave = async () => {
    if (!profile || !user) return;
    setSaving(true);
    setError(null);

    const nextEmail = email.trim().toLowerCase();
    if (!nextEmail || !nextEmail.includes('@')) {
      setError(hu ? 'Adj meg érvényes e-mail címet.' : 'Enter a valid email address.');
      setSaving(false);
      return;
    }

    const profileUpdate: Record<string, string> = {
      full_name: fullName.trim(),
      phone: phone.trim(),
    };

    const emailChanged = nextEmail !== (user.email || '').toLowerCase();
    if (emailChanged) {
      const { error: authError } = await supabase.auth.updateUser({ email: nextEmail });
      if (authError) {
        setError(authError.message);
        setSaving(false);
        return;
      }
      profileUpdate.email = nextEmail;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', profile.id);

    if (profileError) {
      setError(profileError.message);
    } else {
      await refreshProfile();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
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
    const path = profile.id + '/avatar';
    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      setError(uploadError.message);
      setUploadingAvatar(false);
      return;
    }

    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    const avatarUrl = data.publicUrl + '?v=' + Date.now();

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', profile.id);

    if (profileError) {
      setError(profileError.message);
    } else {
      await refreshProfile();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    }
    setUploadingAvatar(false);
  };

  const handleRemoveAvatar = async () => {
    if (!profile) return;
    setError(null);
    setUploadingAvatar(true);

    const { error: removeError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .remove([profile.id + '/avatar']);

    if (removeError) {
      setError(removeError.message);
      setUploadingAvatar(false);
      return;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', profile.id);

    if (profileError) setError(profileError.message);
    else await refreshProfile();
    setUploadingAvatar(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-cream-50">{hu ? 'Beállítások' : 'Settings'}</h1>
        <p className="text-sm text-cream-300/50 mt-1">{hu ? 'Fiók és preferenciák kezelése' : 'Manage your account and preferences'}</p>
      </div>

      <div className="card-lux p-6 space-y-6">
        <h3 className="text-lg font-display font-semibold text-cream-100 flex items-center gap-2">
          <User className="w-5 h-5 text-gold-400" /> {text.profile}
        </h3>

        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="relative shrink-0">
            <div className="w-28 h-28 rounded-2xl overflow-hidden border border-gold-600/30 bg-black/40 flex items-center justify-center">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={fullName || 'Profile'} className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-gold-400/40" />
              )}
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -right-2 -bottom-2 w-9 h-9 rounded-full border border-gold-500/40 bg-ink-900 text-gold-200 flex items-center justify-center hover:bg-gold-500/10"
              title={text.choose}
              disabled={uploadingAvatar}
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.currentTarget.value = '';
                void handleAvatarChange(file);
              }}
            />
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <div className="text-sm font-semibold text-cream-100">{text.avatar}</div>
              <div className="text-xs text-cream-300/45 mt-1">{text.avatarNote}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar} className="btn-ghost text-xs disabled:opacity-50">
                <Upload className="w-4 h-4" /> {uploadingAvatar ? (hu ? 'FELTÖLTÉS…' : 'UPLOADING…') : text.choose}
              </button>
              {profile?.avatar_url && (
                <button type="button" onClick={() => void handleRemoveAvatar()} disabled={uploadingAvatar} className="btn-ghost text-xs text-red-300/80 hover:text-red-200 disabled:opacity-50">
                  <Trash2 className="w-4 h-4" /> {text.remove}
                </button>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="label-lux">{text.fullName}</label>
          <input className="input-lux" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>

        <div>
          <label className="label-lux">{text.email}</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-400/40" />
            <input type="email" className="input-lux pl-10" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="mt-1 text-[11px] text-cream-300/35">{text.emailNote}</div>
        </div>

        <div>
          <label className="label-lux">{text.phone}</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-400/40" />
            <input type="tel" className="input-lux pl-10" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+36 30 123 4567" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-gold-600/20 bg-gold-500/5 p-4">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[.2em] text-gold-300/65">
              <CreditCard className="w-4 h-4" /> {text.credits}
            </div>
            <div className="mt-2 text-2xl font-display font-bold gold-text">
              {isUnlimited ? '∞' : (profile?.credits ?? 0).toLocaleString('hu-HU')}
            </div>
            <div className="mt-1 text-xs text-cream-300/45">{isUnlimited ? (hu ? 'Korlátlan hozzáférés' : 'Unlimited access') : 'credits'}</div>
          </div>

          <div className="rounded-2xl border border-gold-600/20 bg-black/20 p-4">
            <div className="text-[10px] uppercase tracking-[.2em] text-gold-300/65">{text.plan}</div>
            <div className="mt-2 text-lg font-display font-semibold text-cream-50">{isOwner ? 'OWNER' : profile?.plan_id}</div>
            {!isOwner && (
              <button type="button" onClick={() => onNavigate('billing')} className="mt-2 text-xs text-gold-400 hover:text-gold-200 transition-colors">
                {text.changePlan} →
              </button>
            )}
          </div>
        </div>

        {error && <div className="text-sm text-red-300">{error}</div>}

        <div className="flex items-center gap-3">
          <button type="button" onClick={() => void handleSave()} disabled={saving} className="btn-gold text-sm disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? text.saving : text.save}
          </button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-green-300">
              <Check className="w-4 h-4" /> {text.saved}
            </span>
          )}
        </div>
      </div>

      <div className="card-lux p-6 space-y-4">
        <h3 className="text-lg font-display font-semibold text-cream-100 flex items-center gap-2">
          <Lock className="w-5 h-5 text-gold-400" /> {text.password}
        </h3>
        <p className="text-sm text-cream-300/55">
          {hu ? 'A jelszó helyreállításához külön biztonságos űrlap nyílik meg, ahol kétszer kell megadnod az új jelszót.' : 'Password recovery opens a dedicated secure form where you enter the new password twice.'}
        </p>
        <button type="button" onClick={() => onNavigate('reset')} className="btn-ghost text-sm w-fit">
          <Lock className="w-4 h-4" /> {text.resetPassword}
        </button>
      </div>

      <div className="card-lux p-6 space-y-4">
        <h3 className="text-lg font-display font-semibold text-cream-100 flex items-center gap-2">
          <Globe className="w-5 h-5 text-gold-400" /> {hu ? 'Nyelv' : 'Language'}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all border ${lang === l.code
                ? 'border-gold-600/40 bg-gold-600/10 text-gold-200'
                : 'border-ink-600/40 text-cream-300/60 hover:text-cream-200 hover:bg-ink-700/40'}`}
            >
              <span className="text-xs font-mono tracking-wider text-gold-400 w-6">{l.flag}</span>
              <span className="truncate">{l.name}</span>
              {lang === l.code && <Check className="w-3.5 h-3.5 ml-auto" />}
            </button>
          ))}
        </div>
      </div>

      {(isOwner || isAdmin) && (
        <div className="card-lux p-6 border-gold-600/20">
          <h3 className="text-lg font-display font-semibold text-cream-100 flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-gold-400" /> {text.role}
          </h3>
          <p className="text-sm text-cream-300/60">
            {isOwner
              ? (hu ? 'Tulajdonosi hozzáférés: korlátlan kredit és adminisztrációs jogosultság.' : 'Owner access: unlimited credits and administration privileges.')
              : (hu ? 'Admin hozzáférés: adminisztrációs funkciók és a beállított kreditkeret használata.' : 'Admin access: administration features and the configured credit balance.')}
          </p>
        </div>
      )}
    </div>
  );
}
