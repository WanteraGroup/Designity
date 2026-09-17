import { useEffect, useState } from 'react';
import { Image as ImageIcon, FileText, Download, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

interface AssetsPageProps {
  onNavigate: (page: string) => void;
}

interface AssetRow {
  id: string;
  project_id: string | null;
  name: string;
  type: string;
  url: string | null;
  created_at: string;
}

export function AssetsPage({ onNavigate }: AssetsPageProps) {
  const { t } = useI18n();
  const { profile } = useAuth();
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAssets() {
      if (!profile) return;
      const { data } = await supabase
        .from('project_assets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setAssets((data as AssetRow[]) || []);
      setLoading(false);
    }
    loadAssets();
  }, [profile]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-cream-50">{t('assets.title')}</h1>
        <p className="text-sm text-cream-300/50 mt-1">{t('assets.subtitle')}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="card-lux h-32 animate-pulse" />)}
        </div>
      ) : assets.length === 0 ? (
        <div className="card-lux p-16 text-center">
          <ImageIcon className="w-12 h-12 text-cream-400/30 mx-auto mb-4" />
          <p className="text-sm text-cream-300/50 mb-4">{t('assets.noAssets')} {t('assets.noAssetsDesc')}</p>
          <button onClick={() => onNavigate('create')} className="btn-gold text-sm">
            {t('assets.createDesign')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets.map((asset) => (
            <div key={asset.id} className="card-lux p-4 group">
              <div className="aspect-square rounded-lg bg-ink-700/40 flex items-center justify-center mb-3">
                {asset.type === 'image' && asset.url ? (
                  <img src={asset.url} alt={asset.name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <FileText className="w-8 h-8 text-gold-400/40" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-xs font-medium text-cream-100 truncate">{asset.name}</div>
                  <div className="text-[10px] text-cream-300/40 capitalize">{asset.type}</div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1 text-cream-400/40 hover:text-gold-200"><Download className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
