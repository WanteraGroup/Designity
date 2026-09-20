import { useEffect, useMemo, useState } from 'react';
import { Check, ExternalLink, Loader2, Package, Plus, RefreshCw, ShoppingBag, Sparkles, Store, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type ShopifyProduct = {
  id: string;
  title: string;
  handle: string;
  status: string;
  productType: string;
  vendor: string;
  price: string;
  inventory: number;
  imageUrl: string | null;
};

type Props = { onNavigate: (page: string) => void };

const emptyForm = {
  title: '',
  descriptionHtml: '',
  vendor: 'DESIGNLY',
  productType: '',
  price: '0',
  status: 'DRAFT' as 'DRAFT' | 'ACTIVE',
  imageUrl: '',
};

export function ShopifyStudioPage({ onNavigate }: Props) {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [shop, setShop] = useState<{ name: string; domain: string; currencyCode: string } | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error: invokeError } = await supabase.functions.invoke('shopify-studio', {
      body: { action: 'list' },
    });
    if (invokeError || data?.error) {
      setError(data?.message || invokeError?.message || 'A Shopify kapcsolat még nincs konfigurálva.');
    } else {
      setProducts(data.products || []);
      setShop(data.shop || null);
    }
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const activeCount = useMemo(() => products.filter((p) => p.status === 'ACTIVE').length, [products]);

  const createProduct = async () => {
    if (!form.title.trim() || Number(form.price) < 0) return;
    setSaving(true);
    setError(null);
    setMessage(null);

    const { data, error: invokeError } = await supabase.functions.invoke('shopify-studio', {
      body: {
        action: 'create',
        product: {
          title: form.title.trim(),
          descriptionHtml: form.descriptionHtml,
          vendor: form.vendor.trim(),
          productType: form.productType.trim(),
          price: form.price,
          status: form.status,
          imageUrl: form.imageUrl.trim() || null,
        },
      },
    });

    if (invokeError || data?.error) {
      setError(data?.message || invokeError?.message || 'A termék létrehozása nem sikerült.');
    } else {
      setMessage('A termék létrejött Shopify-ban.');
      setForm(emptyForm);
      setShowCreate(false);
      await load();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-gold-400 text-xs uppercase tracking-[0.22em]">
            <ShoppingBag className="w-4 h-4" /> Commerce
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-cream-50 mt-2">Shopify Studio</h1>
          <p className="text-sm text-cream-300/55 mt-1">DESIGNLY-ből kezeld a Shopify termékkatalógust.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void load()} className="btn-ghost text-sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Frissítés
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-gold text-sm">
            <Plus className="w-4 h-4" /> Új termék
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card-lux p-5"><Store className="w-5 h-5 text-gold-400 mb-3" /><div className="text-xs text-cream-400/50">SHOP</div><div className="font-semibold text-cream-100 mt-1">{shop?.name || 'Shopify'}</div><div className="text-xs text-cream-400/50 mt-1">{shop?.domain || 'Kapcsolat ellenőrzése…'}</div></div>
        <div className="card-lux p-5"><Package className="w-5 h-5 text-gold-400 mb-3" /><div className="text-xs text-cream-400/50">TERMÉKEK</div><div className="text-2xl font-bold text-cream-50 mt-1">{products.length}</div></div>
        <div className="card-lux p-5"><Sparkles className="w-5 h-5 text-gold-400 mb-3" /><div className="text-xs text-cream-400/50">AKTÍV</div><div className="text-2xl font-bold text-cream-50 mt-1">{activeCount}</div></div>
      </div>

      {message && <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-200"><Check className="w-4 h-4" />{message}</div>}
      {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}

      <div className="card-lux overflow-hidden">
        <div className="px-5 py-4 border-b border-gold-600/10 flex items-center justify-between">
          <div><h2 className="font-semibold text-cream-100">Shopify katalógus</h2><p className="text-xs text-cream-400/45 mt-1">A Shopify Admin API aktuális adatai.</p></div>
          {shop && <a href={`https://admin.shopify.com/store/${shop.domain.replace('.myshopify.com', '')}/products`} target="_blank" rel="noreferrer" className="text-xs text-gold-400 hover:text-gold-200 flex items-center gap-1">Shopify Admin <ExternalLink className="w-3 h-3" /></a>}
        </div>
        {loading ? (
          <div className="p-10 grid place-items-center"><Loader2 className="w-6 h-6 animate-spin text-gold-400" /></div>
        ) : products.length === 0 ? (
          <div className="p-10 text-center"><Package className="w-10 h-10 mx-auto text-cream-400/20" /><p className="text-cream-300/60 mt-3">Még nincs termék.</p><button onClick={() => setShowCreate(true)} className="btn-gold text-sm mt-4">Első termék létrehozása</button></div>
        ) : (
          <div className="divide-y divide-gold-600/10">
            {products.map((product) => (
              <div key={product.id} className="p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-ink-800 border border-gold-600/10 shrink-0">
                  {product.imageUrl ? <img src={product.imageUrl} alt="" className="w-full h-full object-cover" /> : <Package className="w-5 h-5 m-4 text-cream-400/30" />}
                </div>
                <div className="min-w-0 flex-1"><div className="font-medium text-cream-100 truncate">{product.title}</div><div className="text-xs text-cream-400/45 mt-1">{product.productType || 'Termék'} · {product.vendor || '—'}</div></div>
                <div className="text-right hidden sm:block"><div className="text-sm text-cream-100">{product.price} {shop?.currencyCode || 'HUF'}</div><div className="text-xs text-cream-400/45">{product.inventory} db</div></div>
                <span className={`chip text-[10px] ${product.status === 'ACTIVE' ? 'border-green-500/20 bg-green-500/10 text-green-200' : 'border-gold-600/20 bg-gold-600/10 text-gold-200'}`}>{product.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-[70] bg-ink-950/80 backdrop-blur-sm p-4 grid place-items-center" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-2xl card-lux p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><div><h2 className="text-xl font-display font-bold text-cream-50">Új Shopify termék</h2><p className="text-xs text-cream-400/50 mt-1">Alap termék létrehozása közvetlenül a DESIGNLY-ből.</p></div><button onClick={() => setShowCreate(false)} className="p-2 text-cream-300/60 hover:text-cream-100"><X className="w-5 h-5" /></button></div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><label className="label-lux">Terméknév</label><input className="input-lux" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="pl. DESIGNLY Premium póló" /></div>
              <div><label className="label-lux">Típus</label><input className="input-lux" value={form.productType} onChange={(e) => setForm({ ...form, productType: e.target.value })} placeholder="Merch" /></div>
              <div><label className="label-lux">Gyártó / vendor</label><input className="input-lux" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} /></div>
              <div><label className="label-lux">Ár</label><input className="input-lux" type="number" min="0" step="1" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div><label className="label-lux">Státusz</label><select className="input-lux" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'DRAFT' | 'ACTIVE' })}><option value="DRAFT">Piszkozat</option><option value="ACTIVE">Aktív</option></select></div>
              <div className="md:col-span-2"><label className="label-lux">Leírás</label><textarea className="input-lux min-h-28 resize-y" value={form.descriptionHtml} onChange={(e) => setForm({ ...form, descriptionHtml: e.target.value })} placeholder="Termékleírás…" /></div>
              <div className="md:col-span-2"><label className="label-lux">Kép HTTPS URL <span className="text-cream-400/30">(opcionális)</span></label><input className="input-lux" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://…" /></div>
            </div>
            <div className="flex justify-end gap-2 mt-6"><button onClick={() => setShowCreate(false)} className="btn-ghost text-sm">Mégse</button><button onClick={() => void createProduct()} disabled={saving || !form.title.trim()} className="btn-gold text-sm disabled:opacity-50">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Létrehozás</button></div>
          </div>
        </div>
      )}

      <div className="text-xs text-cream-400/35">A Shopify műveletekhez az alkalmazásnak Shopify Admin API jogosultság kell. A termékírás a <code>write_products</code> scope-on keresztül történik.</div>
    </div>
  );
}
