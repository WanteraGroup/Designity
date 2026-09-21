import { useState } from 'react';
import { ExternalLink, Package, RefreshCw, ShoppingBag, Sparkles } from 'lucide-react';
import { ForgedPanel, ForgedButton, NordicHeader } from '@/components/ui';

interface ShopifyProps {
  onNavigate: (page: string) => void;
}

const products = [
  { id: 1, name: 'Nordic Hoodie', category: 'Apparel', price: '49' },
  { id: 2, name: 'Obsidian Mug', category: 'Home', price: '19' },
];

export default function Shopify({ onNavigate }: ShopifyProps) {
  const [storeUrl, setStoreUrl] = useState('');
  const [category, setCategory] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [saved, setSaved] = useState(false);

  const syncNow = () => {
    setSyncing(true);
    localStorage.setItem('designly_shopify_settings', JSON.stringify({ storeUrl, category }));
    window.setTimeout(() => {
      setSyncing(false);
    }, 900);
  };

  const saveSettings = () => {
    localStorage.setItem('designly_shopify_settings', JSON.stringify({ storeUrl, category }));
    setSaved(true);
  };

  return (
    <div className="relative min-h-screen bg-[#020505] text-[#E3FFFB] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.24]"
        style={{ backgroundImage: "url('/designly-odin-hall-bg.svg')" }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#020505]/35 to-[#020505]/95"
        aria-hidden="true"
      />

      <NordicHeader title="SHOPIFY — MERCHANT HALL" />

      <main className="relative z-10 px-6 lg:px-8 pt-12 lg:pt-16 pb-24 space-y-12 max-w-[1700px] mx-auto">
        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="text-[9px] uppercase tracking-[.28em] text-[#D6B36A]/65">COMMERCE COMMAND</div>
              <h1 className="mt-2 font-serif text-4xl lg:text-5xl">Shopify Overview</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#EEE8DC]/55">
                A Merchant Hall a meglévő Shopify Admin API workspace fölé ad egységes DESIGNLY kezelőfelületet.
              </p>
            </div>
            <ForgedButton variant="secondary" onClick={() => onNavigate('dashboard')}>← Command</ForgedButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <OverviewMetric label="Linked Stores" value="4" icon={ShoppingBag} />
            <OverviewMetric label="Products Synced" value="312" icon={Package} />
            <OverviewMetric label="AI Optimized" value="87%" icon={Sparkles} accent />
          </div>
        </section>

        <section>
          <div className="mb-6">
            <div className="text-[9px] uppercase tracking-[.28em] text-[#9CEEE5]/60">MERCHANT FORGE</div>
            <h2 className="mt-2 font-serif text-3xl lg:text-4xl">Sync Products</h2>
          </div>

          <ForgedPanel className="max-w-4xl">
            <div className="grid md:grid-cols-2 gap-5 text-xs">
              <Field label="Store URL" placeholder="https://yourstore.myshopify.com" value={storeUrl} onChange={setStoreUrl} />
              <Field label="Category" placeholder="All / Apparel / Home / Tech" value={category} onChange={setCategory} />
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <ForgedButton variant="primary" onClick={syncNow}>
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} /> {syncing ? 'Syncing…' : 'Sync Now'}
              </ForgedButton>
              <ForgedButton variant="secondary" onClick={saveSettings}>
                {saved ? 'Settings Saved' : 'Save Settings'}
              </ForgedButton>
              <ForgedButton variant="secondary" onClick={() => onNavigate('shopify-workspace')}>
                Open Shopify Studio
              </ForgedButton>
            </div>
          </ForgedPanel>
        </section>

        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="text-[9px] uppercase tracking-[.28em] text-[#D6B36A]/65">PRODUCT ARCHIVE</div>
              <h2 className="mt-2 font-serif text-3xl lg:text-4xl">Products</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('shopify-workspace')}
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[.16em] text-[#9CEEE5]/60 hover:text-[#E3FFFB]"
            >
              Manage catalog <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {products.map((product) => (
              <ForgedPanel key={product.id}>
                <div className="flex justify-between items-start gap-4 mb-5">
                  <div>
                    <div className="font-serif text-2xl">{product.name}</div>
                    <div className="text-xs text-[#EEE8DC]/55 mt-1">{product.category}</div>
                  </div>
                  <div className="text-[9px] uppercase tracking-[.18em] text-[#9CEEE5]/70">{product.price} USD</div>
                </div>
                <div className="flex gap-3">
                  <ForgedButton variant="secondary" className="flex-1" onClick={() => onNavigate('shopify-workspace')}>Edit</ForgedButton>
                  <ForgedButton variant="secondary" className="flex-1" onClick={() => onNavigate('shopify-workspace')}>Optimize</ForgedButton>
                </div>
              </ForgedPanel>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function OverviewMetric({
  label,
  value,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  icon: typeof ShoppingBag;
  accent?: boolean;
}) {
  return (
    <ForgedPanel>
      <Icon className={`w-5 h-5 mb-3 ${accent ? 'text-[#9CEEE5]/80' : 'text-[#D6B36A]/75'}`} />
      <div className="text-xs text-[#EEE8DC]/55">{label}</div>
      <div className={`font-serif text-4xl mt-2 ${accent ? 'text-[#9CEEE5]' : ''}`}>{value}</div>
    </ForgedPanel>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1 block">
      <span className="text-[#EEE8DC]/70">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#071311]/75 border border-[#263636] rounded-[10px] px-3 py-2.5 text-xs text-[#E3FFFB] placeholder:text-[#EEE8DC]/35 outline-none focus:border-[#9CEEE5]/40 focus:ring-2 focus:ring-[#9CEEE5]/5"
        placeholder={placeholder}
      />
    </label>
  );
}
