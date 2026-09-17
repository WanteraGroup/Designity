import { useState } from 'react';
import { LayoutTemplate, Search, Crown } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { TEMPLATE_CATEGORIES } from '@/lib/constants';

interface TemplatesPageProps {
  onNavigate: (page: string) => void;
}

const TEMPLATES = [
  { name: 'Luxury Barber', category: 'Beauty', premium: true },
  { name: 'Fine Dining', category: 'Restaurant', premium: true },
  { name: 'Modern Clinic', category: 'Business', premium: false },
  { name: 'Elite Fitness', category: 'Fitness', premium: true },
  { name: 'Tech Startup', category: 'Technology', premium: false },
  { name: 'Premium Real Estate', category: 'Real Estate', premium: true },
  { name: 'Wedding Classic', category: 'Wedding', premium: true },
  { name: 'Event Promo', category: 'Events', premium: false },
  { name: 'Boutique Store', category: 'E-commerce', premium: false },
  { name: 'Corporate Pro', category: 'Corporate', premium: true },
  { name: 'Marketing Agency', category: 'Marketing', premium: true },
  { name: 'Personal Portfolio', category: 'Personal', premium: false },
];

export function TemplatesPage({ onNavigate }: TemplatesPageProps) {
  const { t } = useI18n();
  const [category, setCategory] = useState<string>('All');
  const [search, setSearch] = useState('');

  const filtered = TEMPLATES.filter((tpl) => {
    const matchCat = category === 'All' || tpl.category === category;
    const matchSearch = tpl.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-cream-50">{t('templates.title')}</h1>
        <p className="text-sm text-cream-300/50 mt-1">{t('templates.subtitle')}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-400/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-lux pl-10"
            placeholder={t('tpl.searchPlaceholder')}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategory('All')}
          className={`chip transition-all ${category === 'All' ? 'border-gold-600/40 bg-gold-600/10 text-gold-200' : 'border-ink-500/40 text-cream-300/60'}`}
        >
          {t('tpl.all')}
        </button>
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`chip transition-all ${category === cat ? 'border-gold-600/40 bg-gold-600/10 text-gold-200' : 'border-ink-500/40 text-cream-300/60'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card-lux p-12 text-center">
          <LayoutTemplate className="w-10 h-10 text-cream-400/30 mx-auto mb-3" />
          <p className="text-sm text-cream-300/50">{t('tpl.noResults')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tpl, i) => (
            <div
              key={i}
              className="card-lux overflow-hidden group cursor-pointer"
              onClick={() => onNavigate('create')}
            >
              <div className="aspect-[4/3] bg-gradient-to-br from-ink-800 to-ink-850 flex items-center justify-center relative">
                <LayoutTemplate className="w-10 h-10 text-gold-400/20 group-hover:text-gold-400/40 transition-colors" />
                {tpl.premium && (
                  <div className="chip border-gold-600/30 bg-gold-600/10 text-gold-200 text-[10px]">
                    <Crown className="w-3 h-3" /> {t('tpl.premium')}
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-sm font-medium text-cream-100">{tpl.name}</h3>
                <p className="text-xs text-cream-300/40 mt-0.5">{tpl.category}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
