import { useState } from 'react';
import { User, Mail, Globe, Shield, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

interface SettingsPageProps {
  onNavigate: (page: string) => void;
}

export function SettingsPage({ onNavigate }: SettingsPageProps) {
  const { t } = useI18n();
  const { profile, isOwner, isAdmin, refreshProfile } = useAuth();
  const { lang, setLang, languages } = useI18n();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', profile.id);
    if (error) {
      setError(error.message);
    } else {
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-cream-50">{t('settings.title')}</h1>
        <p className="text-sm text-cream-300/50 mt-1">{t('settings.subtitle')}</p>
      </div>

      {/* Profile */}
      <div className="card-lux p-6 space-y-5">
        <h3 className="text-lg font-display font-semibold text-cream-100 flex items-center gap-2">
          <User className="w-5 h-5 text-gold-400" />
          {t('settings.profile')}
        </h3>

        <div>
          <label className="label-lux">{t('auth.fullName')}</label>
          <input className="input-lux" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>

        <div>
          <label className="label-lux">{t('auth.email')}</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-400/40" />
            <input className="input-lux pl-10 opacity-60" value={profile?.email || ''} disabled />
          </div>
        </div>

        <div>
          <label className="label-lux">{t('settings.plan')}</label>
          <div className="flex items-center gap-2">
            <span className="chip border-gold-600/30 bg-gold-600/10 text-gold-200 capitalize">{isOwner ? 'OWNER' : profile?.plan_id}</span>
            {!isOwner && (
              <button onClick={() => onNavigate('billing')} className="text-xs text-gold-400 hover:text-gold-200 transition-colors">
                {t('settings.changePlan')} →
              </button>
            )}
          </div>
        </div>

        {error && <div className="text-sm text-red-300">{error}</div>}

        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-gold text-sm disabled:opacity-50">
            {saving ? t('common.loading') : t('common.save')}
          </button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-green-300">
              <Check className="w-4 h-4" /> {t('settings.saved')}
            </span>
          )}
        </div>
      </div>

      {/* Language */}
      <div className="card-lux p-6 space-y-4">
        <h3 className="text-lg font-display font-semibold text-cream-100 flex items-center gap-2">
          <Globe className="w-5 h-5 text-gold-400" />
          {t('settings.language')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all border ${
                lang === l.code
                  ? 'border-gold-600/40 bg-gold-600/10 text-gold-200'
                  : 'border-ink-600/40 text-cream-300/60 hover:text-cream-200 hover:bg-ink-700/40'
              }`}
            >
              <span className="text-xs font-mono tracking-wider text-gold-400 w-6">{l.flag}</span>
              <span className="truncate">{l.name}</span>
              {lang === l.code && <Check className="w-3.5 h-3.5 ml-auto" />}
            </button>
          ))}
        </div>
      </div>

      {/* Role info */}
      {(isOwner || isAdmin) && (
        <div className="card-lux p-6 border-gold-600/20">
          <h3 className="text-lg font-display font-semibold text-cream-100 flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-gold-400" />
            {t('settings.role')}
          </h3>
          <p className="text-sm text-cream-300/60">
            {isOwner
              ? t('settings.ownerRoleDesc')
              : t('settings.adminRoleDesc')}
          </p>
        </div>
      )}
    </div>
  );
}
