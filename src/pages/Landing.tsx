import { ForgedPanel, ForgedButton, NordicHeader } from "../components/ui";

interface LandingProps {
  onNavigate?: (page: string) => void;
}

export default function Landing({ onNavigate }: LandingProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#020505] text-[#E3FFFB]">
      {/* Nordic atmospheric background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.22]"
        style={{ backgroundImage: "url('/designly-odin-hall-bg.svg')" }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#020505]/40 to-[#020505]/90"
        aria-hidden="true"
      />

      <NordicHeader title="DESIGNITY STUDIO — DIGITAL CREATIVE STUDIO" />

      <main className="relative z-10 flex flex-col items-center justify-center pt-24 pb-32 px-6">
        <h1 className="font-serif text-[clamp(42px,7vw,64px)] tracking-wide text-center mb-6">
          A PRÉMIUM DIGITÁLIS STÚDIÓ
        </h1>

        <p className="text-lg text-[#EEE8DC]/70 max-w-2xl text-center mb-12 leading-relaxed">
          WEB. BRAND. DESIGN. CONTENT.
          <br />
          Egyetlen stúdióban: ötlettől a kész digitális munkáig.
        </p>

        <ForgedPanel className="max-w-xl w-full mt-10">
          <div className="flex flex-col items-center gap-6">
            <ForgedButton
              variant="primary"
              className="w-full py-4 text-lg"
              onClick={() => onNavigate?.("create")}
            >
              MONDD EL, MIT SZERETNÉL
            </ForgedButton>

            <ForgedButton
              variant="secondary"
              className="w-full py-3"
              onClick={() => onNavigate?.("agents")}
            >
              AI STUDIO
            </ForgedButton>
          </div>
        </ForgedPanel>
<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8 w-full max-w-5xl">
{[
  ["WEB","Weboldalak, landingek, webappok","create"],
  ["BRAND","Logó, arculat, brand guide","brands"],
  ["DIGITÁLIS DESIGN","Social, banner, hirdetés, merch","create"],
  ["CREATOR","YouTube, Twitch, Discord, stream","creator"],
  ["ART","Tattoo, karakter, illusztráció","tattoo"],
  ["TERVEZÉS","Alaprajz, látvány, koncepció","planner"],
  ["VEKTOR","SVG, PDF, plotter, nyomda","create"],
  ["CONTENT","SEO, webszöveg, reklám, videó","create"],
].map(([title,copy,page])=><button key={title} onClick={()=>onNavigate?.(page)} className="text-left p-5 rounded-lg border border-gold-600/20 bg-black/40 hover:border-gold-400/50 transition-all"><span className="text-gold-300 text-xs tracking-widest">{title}</span><p className="mt-2 text-sm text-cream-200/60">{copy}</p></button>)}
</div>
      </main>
    </div>
  );
}

