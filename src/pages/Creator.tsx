import { useMemo } from 'react';
import { Brush, Megaphone, Palette, Sparkles, Users } from 'lucide-react';
import { ForgedPanel, ForgedButton, NordicHeader } from '@/components/ui';

interface CreatorProps {
  onNavigate: (page: string) => void;
}

export default function Creator({ onNavigate }: CreatorProps) {
  const metrics = useMemo(() => [
    { label: 'Artifacts created', value: '412', icon: Brush },
    { label: 'Campaigns', value: '12', icon: Megaphone },
    { label: 'Brands', value: '6', icon: Palette },
  ], []);

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

      <NordicHeader title="CREATOR — CREATOR HUB" />

      <main className="relative z-10 px-6 lg:px-8 pt-12 lg:pt-16 pb-24 space-y-12 max-w-[1700px] mx-auto">
        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[9px] uppercase tracking-[.28em] text-[#D6B36A]/65">
                <Users className="w-4 h-4" /> CREATOR COMMAND
              </div>
              <h1 className="mt-2 font-serif text-4xl lg:text-5xl">Creator Overview</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#EEE8DC]/55">
                A Creator Hub a tartalomkészítést, kampányokat, brandeket és merch-produkciókat egyetlen DESIGNLY munkafolyamatba rendezi.
              </p>
            </div>
            <ForgedButton variant="secondary" onClick={() => onNavigate('dashboard')}>← Command</ForgedButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {metrics.map(({ label, value, icon: Icon }) => (
              <ForgedPanel key={label}>
                <Icon className="w-5 h-5 mb-3 text-[#D6B36A]/75" />
                <div className="text-xs text-[#EEE8DC]/60">{label}</div>
                <div className="font-serif text-4xl mt-2">{value}</div>
              </ForgedPanel>
            ))}
          </div>
        </section>

        <section>
          <ForgedPanel className="max-w-5xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div>
                <div className="text-[9px] uppercase tracking-[.25em] text-[#D6B36A]/65">CREATOR FACTORY</div>
                <h2 className="font-serif text-3xl mt-2">Creator → Merch → Production</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[#EEE8DC]/50">
                  A részletes merch-tervezés, AI master artwork, ingyenes előnézet, végleges generálás és production spec a meglévő Creator / Gamer Product Studio workspace-ben érhető el.
                </p>
              </div>
              <ForgedButton variant="primary" onClick={() => onNavigate('creator-workspace')}>
                <Sparkles className="w-4 h-4" /> Open Creator Studio
              </ForgedButton>
            </div>
          </ForgedPanel>
        </section>

        <section className="grid lg:grid-cols-3 gap-6">
          <ForgedPanel>
            <div className="text-[9px] uppercase tracking-[.22em] text-[#9CEEE5]/60">ARTIFACTS</div>
            <div className="font-serif text-2xl mt-2">Creative Output</div>
            <p className="mt-2 text-xs leading-6 text-[#EEE8DC]/45">Nyisd meg a Create/Editor munkafolyamatot a létrehozott design artifactok további kezeléséhez.</p>
            <div className="mt-5"><ForgedButton variant="secondary" onClick={() => onNavigate('create')}>Open Create</ForgedButton></div>
          </ForgedPanel>

          <ForgedPanel>
            <div className="text-[9px] uppercase tracking-[.22em] text-[#9CEEE5]/60">CAMPAIGNS</div>
            <div className="font-serif text-2xl mt-2">Creator Campaigns</div>
            <p className="mt-2 text-xs leading-6 text-[#EEE8DC]/45">A kampánytervezést és generálást a Strategic War Room kezeli.</p>
            <div className="mt-5"><ForgedButton variant="secondary" onClick={() => onNavigate('campaign')}>Open Campaigns</ForgedButton></div>
          </ForgedPanel>

          <ForgedPanel>
            <div className="text-[9px] uppercase tracking-[.22em] text-[#9CEEE5]/60">BRANDS</div>
            <div className="font-serif text-2xl mt-2">Brand Identity</div>
            <p className="mt-2 text-xs leading-6 text-[#EEE8DC]/45">A creatorhoz tartozó identitásokat a Brand Vaultban lehet kezelni.</p>
            <div className="mt-5"><ForgedButton variant="secondary" onClick={() => onNavigate('brands')}>Open Brands</ForgedButton></div>
          </ForgedPanel>
        </section>
      </main>
    </div>
  );
}
