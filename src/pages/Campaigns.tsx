import { useState } from 'react';
import { ForgedPanel, ForgedButton, NordicHeader } from '@/components/ui';

interface CampaignsProps {
  onNavigate: (page: string) => void;
}

const campaigns = [
  {
    id: 1,
    name: 'Nordic Launch 2026',
    platforms: 'Meta, Google, TikTok',
    status: 'Running',
    ctr: '3.2%',
    cpc: '$0.41',
    conversions: '1,204',
  },
  {
    id: 2,
    name: 'AI Creative OS Promo',
    platforms: 'YouTube, Meta',
    status: 'Optimizing',
    ctr: '4.8%',
    cpc: '$0.33',
    conversions: '2,018',
  },
];

export default function Campaigns({ onNavigate }: CampaignsProps) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [draftSaved, setDraftSaved] = useState(false);
  const [optimizing, setOptimizing] = useState<number | null>(null);

  const update = (key: string, value: string) => {
    setDraftSaved(false);
    setForm((current) => ({ ...current, [key]: value }));
  };

  const saveDraft = () => {
    localStorage.setItem('designly_campaign_draft', JSON.stringify(form));
    setDraftSaved(true);
  };

  const generateCampaign = () => {
    localStorage.setItem('designly_campaign_draft', JSON.stringify(form));
    onNavigate('campaign-workspace');
  };

  const optimize = (id: number) => {
    setOptimizing(id);
    window.setTimeout(() => setOptimizing(null), 900);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#020505] text-[#E3FFFB]">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.24]"
        style={{ backgroundImage: "url('/designly-odin-hall-bg.svg')" }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#020505]/35 to-[#020505]/94"
        aria-hidden="true"
      />

      <NordicHeader title="CAMPAIGNS — STRATEGIC WAR ROOM" />

      <main className="relative z-10 px-6 lg:px-8 pt-12 lg:pt-16 pb-24 space-y-12 max-w-[1700px] mx-auto">
        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="text-[9px] uppercase tracking-[.28em] text-[#D6B36A]/65">STRATEGIC COMMAND</div>
              <h1 className="mt-2 font-serif text-4xl lg:text-5xl tracking-wide">Campaign Overview</h1>
            </div>
            <ForgedButton variant="secondary" onClick={() => onNavigate('dashboard')}>← Command</ForgedButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <OverviewMetric label="Active Campaigns" value="12" />
            <OverviewMetric label="Conversions" value="4,921" />
            <OverviewMetric label="AI Optimization Score" value="92%" accent />
          </div>
        </section>

        <section>
          <div className="mb-6">
            <div className="text-[9px] uppercase tracking-[.28em] text-[#9CEEE5]/60">CAMPAIGN FORGE</div>
            <h2 className="mt-2 font-serif text-3xl lg:text-4xl tracking-wide">Create New Campaign</h2>
          </div>

          <ForgedPanel className="max-w-4xl">
            <div className="grid md:grid-cols-2 gap-5 text-xs">
              <Field label="Campaign Name" placeholder="Pl. Nordic Launch 2026" value={form.name || ''} onChange={(v) => update('name', v)} />
              <Field label="Objective" placeholder="Awareness / Conversion / Lead Gen / Sales" value={form.objective || ''} onChange={(v) => update('objective', v)} />
              <Field label="Target Audience" placeholder="Demographics, interests, regions" value={form.audience || ''} onChange={(v) => update('audience', v)} />
              <Field label="Platforms" placeholder="Meta, Google, TikTok, YouTube, Shopify" value={form.platforms || ''} onChange={(v) => update('platforms', v)} />
              <Field label="Creative Style" placeholder="Nordic / Futuristic / Minimal / Dark luxury" value={form.style || ''} onChange={(v) => update('style', v)} />
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <ForgedButton variant="primary" onClick={generateCampaign}>Generate Campaign</ForgedButton>
              <ForgedButton variant="secondary" onClick={saveDraft}>
                {draftSaved ? 'Draft Saved' : 'Save Draft'}
              </ForgedButton>
              <span className="text-[10px] uppercase tracking-[.18em] text-[#EEE8DC]/35">
                AI preview → approval → final generation
              </span>
            </div>
          </ForgedPanel>
        </section>

        <section>
          <div className="mb-6">
            <div className="text-[9px] uppercase tracking-[.28em] text-[#D6B36A]/65">LIVE OPERATIONS</div>
            <h2 className="mt-2 font-serif text-3xl lg:text-4xl tracking-wide">Active Campaigns</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {campaigns.map((campaign) => (
              <ForgedPanel key={campaign.id}>
                <div className="flex justify-between items-start gap-4 mb-5">
                  <div>
                    <div className="font-serif text-2xl">{campaign.name}</div>
                    <div className="text-xs text-[#EEE8DC]/55 mt-1">{campaign.platforms}</div>
                  </div>
                  <div className="text-[9px] uppercase tracking-[.18em] text-[#9CEEE5]/70 border border-[#9CEEE5]/15 rounded-full px-2.5 py-1">
                    {campaign.status}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Metric label="CTR" value={campaign.ctr} />
                  <Metric label="CPC" value={campaign.cpc} />
                  <Metric label="Conversions" value={campaign.conversions} />
                </div>

                <div className="mt-6 flex gap-3">
                  <ForgedButton variant="secondary" className="flex-1" onClick={() => onNavigate('campaign-workspace')}>Open</ForgedButton>
                  <ForgedButton variant="secondary" className="flex-1" onClick={() => optimize(campaign.id)}>
                    {optimizing === campaign.id ? 'Optimizing…' : 'Optimize'}
                  </ForgedButton>
                </div>
              </ForgedPanel>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function OverviewMetric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <ForgedPanel>
      <div className="text-xs text-[#EEE8DC]/55">{label}</div>
      <div className={`font-serif text-4xl mt-2 ${accent ? 'text-[#9CEEE5]' : 'text-[#E3FFFB]'}`}>{value}</div>
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
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-[#071311]/75 border border-[#263636] rounded-[10px] px-3 py-2.5 text-xs text-[#E3FFFB] placeholder:text-[#EEE8DC]/35 outline-none focus:border-[#9CEEE5]/40 focus:ring-2 focus:ring-[#9CEEE5]/5"
        placeholder={placeholder}
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-[#9CEEE5]/10 bg-[#071311]/45 p-3 text-center">
      <div className="text-[9px] uppercase tracking-[.18em] text-[#EEE8DC]/45">{label}</div>
      <div className="font-serif text-xl mt-1 text-[#E3FFFB]">{value}</div>
    </div>
  );
}
