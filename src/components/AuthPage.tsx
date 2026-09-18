import { useState } from 'react';
import { Mail, Lock, User, ArrowLeft, AlertCircle } from 'lucide-react';
import { Logo } from './Logo';
import { CelticEmblem } from './CelticEmblem';
import { LanguageSelector } from './LanguageSelector';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

interface AuthPageProps {
  mode: 'login' | 'signup' | 'reset';
  onNavigate: (page: string) => void;
}

export function AuthPage({ mode, onNavigate }: AuthPageProps) {
  const { t } = useI18n();
  const { user, signIn, signUp, resetPassword, updatePassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (mode === 'reset' && user) {
      if (newPassword.length < 6) {
        setError(t('auth.passwordTooShort'));
        return;
      }
      if (newPassword !== newPasswordConfirm) {
        setError(t('auth.passwordMismatch'));
        return;
      }
      setLoading(true);
      const { error } = await updatePassword(newPassword);
      setLoading(false);
      if (error) setError(error);
      else {
        setSuccess(t('auth.passwordUpdated'));
        setNewPassword('');
        setNewPasswordConfirm('');
      }
      return;
    }

    if (mode === 'reset') {
      if (!email.trim()) {
        setError(t('auth.emailRequired'));
        return;
      }
      setLoading(true);
      const { error } = await resetPassword(email.trim());
      setLoading(false);
      if (error) setError(error);
      else setSuccess(t('auth.resetSent'));
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    setLoading(true);
    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
        setLoading(false);
      } else {
        onNavigate('dashboard');
      }
    } else {
      const { error } = await signUp(email, password, fullName);
      setLoading(false);
      if (error) setError(error);
      else onNavigate('dashboard');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — emblem */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden bg-ink-950">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-gold-600/5 via-transparent to-transparent" />
        <div className="relative flex flex-col items-center gap-8">
          <CelticEmblem size={240} animate showD />
          <div className="text-center">
            <div className="font-display text-3xl font-bold text-cream-50 tracking-wide">DESIGNLY</div>
            <div className="text-xs tracking-[0.4em] text-gold-400 mt-1">STUDIO</div>
          </div>
          <p className="text-cream-300/50 text-sm max-w-xs text-center italic font-display">
            One idea. One brand. Everything designed.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-ink-900 relative">
        <div className="absolute top-4 right-4">
          <LanguageSelector />
        </div>

        <button
          onClick={() => onNavigate('landing')}
          className="absolute top-4 left-4 flex items-center gap-2 text-sm text-cream-300 hover:text-gold-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{t('common.back')}</span>
        </button>

        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8 lg:hidden">
            <Logo size={48} />
          </div>

          <h1 className="text-2xl font-display font-bold text-cream-50 text-center mb-2">
            {mode === 'login' && t('auth.login')}
            {mode === 'signup' && t('auth.signup')}
            {mode === 'reset' && (user ? t('auth.setNewPassword') : t('auth.forgotPassword'))}
          </h1>

          <div className="h-px w-12 bg-gold-gradient mx-auto mb-8" />

          {error && (
            <div className="mb-6 flex items-start gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-3 rounded-lg border border-green-500/30 bg-green-500/10 text-sm text-green-300">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <div>
                <label className="label-lux">{t('auth.fullName')}</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-400/40" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-lux pl-10"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="label-lux">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-400/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-lux pl-10"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {mode !== 'reset' && !user && (
              <div>
                <label className="label-lux">{t('auth.password')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-400/40" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-lux pl-10"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {mode === 'reset' && user && (
              <>
                <div>
                  <label className="label-lux">{t('auth.newPassword')}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-400/40" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input-lux pl-10"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div>
                  <label className="label-lux">{t('auth.confirmPassword')}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-400/40" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPasswordConfirm}
                      onChange={(e) => setNewPasswordConfirm(e.target.value)}
                      className="input-lux pl-10"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </>
            )}

            {mode === 'signup' && (
              <div>
                <label className="label-lux">{t('auth.confirmPassword')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-400/40" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-lux pl-10"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => onNavigate('reset')}
                  className="text-xs text-gold-400 hover:text-gold-200 transition-colors"
                >
                  {t('auth.forgotPassword')}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('common.loading') : (
                mode === 'login' ? t('auth.loginCta') :
                mode === 'signup' ? t('auth.signupCta') :
                (user ? t('auth.updatePassword') : t('auth.resetPassword'))
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-cream-300/60">
            {mode === 'login' && (
              <>
                {t('auth.noAccount')}{' '}
                <button onClick={() => onNavigate('signup')} className="text-gold-400 hover:text-gold-200 transition-colors font-medium">
                  {t('nav.signup')}
                </button>
              </>
            )}
            {mode === 'signup' && (
              <>
                {t('auth.haveAccount')}{' '}
                <button onClick={() => onNavigate('login')} className="text-gold-400 hover:text-gold-200 transition-colors font-medium">
                  {t('nav.login')}
                </button>
              </>
            )}
            {mode === 'reset' && !user && (
              <button onClick={() => onNavigate('login')} className="text-gold-400 hover:text-gold-200 transition-colors font-medium">
                {t('auth.backToLogin')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
