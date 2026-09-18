import { useState, useEffect, useCallback } from 'react';
import { Check, X, AlertCircle, CreditCard, Loader2, ArrowRight, Mail, Clock, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { createCheckout, getPaymentStatus } from '@/lib/ai';
import { PUBLIC_PLANS, CREDIT_PACKAGES, formatPrice, getCustomCreditPrice } from '@/lib/constants';

interface CheckoutPageProps {
  onNavigate: (page: string) => void;
  checkoutItem?: { type: 'subscription' | 'credit_package'; itemId: string } | null;
}

type CheckoutState = 'idle' | 'processing' | 'initiated' | 'success' | 'failed' | 'cancelled' | 'not_configured';

export function CheckoutPage({ onNavigate, checkoutItem }: CheckoutPageProps) {
  const { t, lang } = useI18n();
  const { isOwner, isUnlimited } = useAuth();
  const [status, setStatus] = useState<CheckoutState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [item, setItem] = useState(checkoutItem || null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  // Check URL params for redirect status from payment link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlStatus = params.get('status');
    const urlPaymentId = params.get('payment');
    if (urlPaymentId) setPaymentId(urlPaymentId);
    if (urlStatus === 'initiated') setStatus('initiated');
    else if (urlStatus === 'success') setStatus('initiated'); // link success = user completed form, still needs server confirmation
    else if (urlStatus === 'failed') setStatus('failed');
    else if (urlStatus === 'cancelled') setStatus('cancelled');
  }, []);

  // Poll payment status when initiated
  const checkPaymentStatus = useCallback(async () => {
    if (!paymentId) return;
    setPolling(true);
    const result = await getPaymentStatus(paymentId);
    setPolling(false);
    if (result.success && result.status === 'succeeded') {
      setStatus('success');
    } else if (result.success && result.status === 'failed') {
      setStatus('failed');
    }
    // pending stays in initiated state
  }, [paymentId]);

  useEffect(() => {
    if (status !== 'initiated' || !paymentId) return;
    checkPaymentStatus();
    const interval = setInterval(checkPaymentStatus, 10000);
    return () => clearInterval(interval);
  }, [status, paymentId, checkPaymentStatus]);

  const customCreditMatch = item?.type === 'credit_package' ? item.itemId.match(/^custom_(\\d+)$/) : null;
  const customCreditCount = customCreditMatch ? Math.max(1, Math.min(10000, Number(customCreditMatch[1]))) : null;
  const selectedItem = item
    ? item.type === 'subscription'
      ? PUBLIC_PLANS.find((p) => p.id === item.itemId)
      : customCreditCount !== null
        ? { id: item.itemId, credits: customCreditCount, price: getCustomCreditPrice(customCreditCount), label: `${customCreditCount.toLocaleString()} credits` }
        : CREDIT_PACKAGES.find((p) => p.id === item.itemId)
    : null;

  const handleCheckout = async () => {
    if (!item) return;
    setStatus('processing');
    setError(null);

    const result = await createCheckout({
      itemType: item.type,
      itemId: item.itemId,
    });

    if (result.providerNotConfigured) {
      setStatus('not_configured');
      setError(result.message || t('checkout.providerNotConfiguredDesc'));
      return;
    }

    if (!result.success) {
      setStatus('failed');
      setError(result.message || t('checkout.failed'));
      return;
    }

    if (result.checkoutUrl) {
      setPaymentId(result.paymentId || null);
      window.location.href = result.checkoutUrl;
    } else {
      setStatus('not_configured');
      setError(t('checkout.providerNotConfiguredDesc'));
    }
  };

  if (isOwner || isUnlimited) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-gold-600/15 border border-gold-600/30 flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-gold-400" />
        </div>
        <h2 className="text-2xl font-display font-bold gold-text mb-4">{t('checkout.ownerNoPayment')}</h2>
        <p className="text-sm text-cream-300/60 mb-8">{t('settings.ownerRoleDesc')}</p>
        <button onClick={() => onNavigate('dashboard')} className="btn-ghost text-sm">
          {t('common.back')}
        </button>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-green-400" />
        </div>
        <h2 className="text-2xl font-display font-bold text-cream-50 mb-3">{t('checkout.successTitle')}</h2>
        <p className="text-sm text-cream-300/60 mb-8">{t('checkout.successDesc')}</p>
        <button onClick={() => onNavigate('dashboard')} className="btn-gold text-sm">
          {t('nav.dashboard')}
        </button>
      </div>
    );
  }

  if (status === 'initiated') {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-gold-600/15 border border-gold-600/30 flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-gold-400" />
        </div>
        <h2 className="text-2xl font-display font-bold text-cream-50 mb-3">{t('checkout.initiatedTitle')}</h2>
        <p className="text-sm text-cream-300/60 mb-2">{t('checkout.initiatedDesc')}</p>
        <p className="text-xs text-cream-300/40 mb-8">{t('checkout.initiatedSubDesc')}</p>
        <div className="flex justify-center gap-3">
          <button onClick={checkPaymentStatus} disabled={polling} className="btn-gold text-sm disabled:opacity-40">
            <RefreshCw className={`w-4 h-4 ${polling ? 'animate-spin' : ''}`} />
            {t('checkout.checkStatus')}
          </button>
          <button onClick={() => onNavigate('billing')} className="btn-ghost text-sm">
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
          <X className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-2xl font-display font-bold text-cream-50 mb-3">{t('checkout.failedTitle')}</h2>
        <p className="text-sm text-cream-300/60 mb-8">{error || t('checkout.failedDesc')}</p>
        <div className="flex justify-center gap-3">
          <button onClick={() => { setStatus('idle'); setError(null); }} className="btn-gold text-sm">
            {t('checkout.retry')}
          </button>
          <button onClick={() => onNavigate('billing')} className="btn-ghost text-sm">
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-ink-700/50 border border-ink-600/40 flex items-center justify-center mx-auto mb-6">
          <X className="w-10 h-10 text-cream-400/60" />
        </div>
        <h2 className="text-2xl font-display font-bold text-cream-50 mb-3">{t('checkout.cancelledTitle')}</h2>
        <p className="text-sm text-cream-300/60 mb-8">{t('checkout.cancelledDesc')}</p>
        <button onClick={() => onNavigate('billing')} className="btn-ghost text-sm">
          {t('common.back')}
        </button>
      </div>
    );
  }

  if (status === 'not_configured') {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-amber-600/15 border border-amber-600/30 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-amber-400" />
        </div>
        <h2 className="text-2xl font-display font-bold text-cream-50 mb-3">{t('checkout.providerNotConfigured')}</h2>
        <p className="text-sm text-cream-300/60 mb-2">{error || t('checkout.providerNotConfiguredDesc')}</p>
        <div className="card-lux p-6 max-w-md mx-auto mt-6 text-left">
          <div className="flex items-center gap-3 mb-3">
            <Mail className="w-5 h-5 text-gold-400" />
            <span className="text-sm font-medium text-cream-100">{t('checkout.contactUs')}</span>
          </div>
          <p className="text-xs text-cream-300/50 leading-relaxed">{t('checkout.contactDesc')}</p>
        </div>
        <button onClick={() => onNavigate('billing')} className="btn-ghost text-sm mt-6">
          {t('common.back')}
        </button>
      </div>
    );
  }

  if (!item || !selectedItem) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <CreditCard className="w-12 h-12 text-cream-400/30 mx-auto mb-4" />
        <p className="text-sm text-cream-300/50 mb-4">{t('checkout.noItem')}</p>
        <button onClick={() => onNavigate('billing')} className="btn-gold text-sm">
          {t('nav.billing')}
        </button>
      </div>
    );
  }

  const price = 'priceMonthly' in selectedItem ? selectedItem.priceMonthly : selectedItem.price;
  const name = 'name' in selectedItem ? selectedItem.name : selectedItem.label;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-display font-bold text-cream-50">{t('checkout.title')}</h1>
        <p className="text-sm text-cream-300/50 mt-1">{t('checkout.subtitle')}</p>
      </div>

      {/* Order summary */}
      <div className="card-lux p-6 space-y-4">
        <h3 className="text-sm font-display font-semibold text-cream-100">{t('checkout.orderSummary')}</h3>
        <div className="flex justify-between items-center pb-3 border-b border-ink-600/40">
          <span className="text-sm text-cream-300/60">{item.type === 'subscription' ? t('checkout.plan') : t('checkout.creditPackage')}</span>
          <span className="text-sm font-medium text-cream-100">{name}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-cream-300/60">{t('checkout.total')}</span>
          <span className="text-xl font-display font-bold gold-text">{formatPrice(price, lang)}</span>
        </div>
      </div>

      {/* Checkout action */}
      {status === 'processing' ? (
        <div className="card-lux p-8 text-center">
          <Loader2 className="w-8 h-8 text-gold-400 animate-spin mx-auto mb-4" />
          <p className="text-sm text-cream-300/60">{t('checkout.processing')}</p>
        </div>
      ) : (
        <div className="card-lux p-6 space-y-4">
          <h3 className="text-sm font-display font-semibold text-cream-100">{t('checkout.paymentMethod')}</h3>
          <button
            onClick={handleCheckout}
            className="btn-gold w-full text-sm"
          >
            <CreditCard className="w-4 h-4" />
            {t('checkout.proceedToPayment')}
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-xs text-cream-300/40 text-center leading-relaxed">{t('checkout.secureNote')}</p>
        </div>
      )}

      <div className="text-center">
        <button onClick={() => onNavigate('billing')} className="text-xs text-cream-400/40 hover:text-cream-300 transition-colors">
          {t('common.back')}
        </button>
      </div>
    </div>
  );
}
