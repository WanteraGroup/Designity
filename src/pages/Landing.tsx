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

      <NordicHeader title="DESIGNLY — CREATIVE OPERATING SYSTEM" />

      <main className="relative z-10 flex flex-col items-center justify-center pt-24 pb-32 px-6">
        <h1 className="font-serif text-[clamp(42px,7vw,64px)] tracking-wide text-center mb-6">
          A Nordic AI Creative OS
        </h1>

        <p className="text-lg text-[#EEE8DC]/70 max-w-2xl text-center mb-12 leading-relaxed">
          Ancient Nordic soul. Modern AI core.
          <br />
          A teljes kreatív operációs rendszered egyetlen prémium felületen.
        </p>

        <ForgedPanel className="max-w-xl w-full mt-10">
          <div className="flex flex-col items-center gap-6">
            <ForgedButton
              variant="primary"
              className="w-full py-4 text-lg"
              onClick={() => onNavigate?.("create")}
            >
              Enter the Forge
            </ForgedButton>

            <ForgedButton
              variant="secondary"
              className="w-full py-3"
              onClick={() => onNavigate?.("agents")}
            >
              Explore Agents
            </ForgedButton>
          </div>
        </ForgedPanel>
      </main>
    </div>
  );
}

