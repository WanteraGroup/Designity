import { ForgedPanel, ForgedButton } from "../components/ui";

interface WorksProps {
  onNavigate?: (page: string) => void;
}

const works = [
  { title: "WEB", eyebrow: "WEB", copy: "Weboldalak, landing oldalak, webappok és digitális felületek.", page: "create" },
  { title: "BRAND", eyebrow: "BRAND", copy: "Arculat, logó, vizuális rendszer és márkaanyagok.", page: "brands" },
  { title: "DIGITÁLIS DESIGN", eyebrow: "DESIGN", copy: "Social kreatívok, bannerek, kampányanyagok és digitális grafika.", page: "create" },
  { title: "CREATOR", eyebrow: "CREATOR", copy: "YouTube, Twitch, Discord, stream és creator vizuálok.", page: "creator" },
  { title: "ART", eyebrow: "ART", copy: "Illusztráció, karakter, tattoo és egyedi vizuális alkotások.", page: "tattoo" },
  { title: "TERVEZÉS", eyebrow: "PLANNING", copy: "Koncepciók, látványtervek, alaprajzok és vizualizáció.", page: "planner" },
  { title: "VEKTOR", eyebrow: "VECTOR", copy: "SVG, nyomdai grafika, plotter- és gyártásra kész vektor.", page: "create" },
  { title: "CONTENT", eyebrow: "CONTENT", copy: "SEO, webszöveg, reklám, kampány- és videótartalom.", page: "create" },
];

export default function Works({ onNavigate }: WorksProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020505] text-[#EEE8DC]">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.20]"
        style={{ backgroundImage: "url('/designly-odin-hall-bg.svg')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#020505]/30 via-[#020505]/75 to-[#020505]" aria-hidden="true" />

      <main className="relative z-10 mx-auto max-w-7xl px-6 pt-28 pb-24">
        <div className="max-w-4xl mb-14">
          <p className="text-xs tracking-[0.35em] text-gold-300 uppercase">DESIGNITY STUDIO</p>
          <h1 className="mt-4 font-serif text-5xl md:text-7xl tracking-wide">MUNKÁK</h1>
          <p className="mt-6 max-w-2xl text-base md:text-lg leading-relaxed text-cream-200/65">
            Válaszd ki, miben dolgozzunk veled. A DESIGNITY STUDIO a feladat alapján csak azokat az AI- és kreatív
            specialistákat vonja be, amelyekre az adott projekthez ténylegesen szükség van.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {works.map((work) => (
            <button
              key={work.title}
              onClick={() => onNavigate?.(work.page)}
              className="group text-left"
            >
              <ForgedPanel className="h-full min-h-[210px] p-6 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-gold-400/60">
                <span className="text-[10px] tracking-[0.28em] text-gold-300/80">{work.eyebrow}</span>
                <h2 className="mt-4 text-xl font-semibold tracking-wide text-cream-100">{work.title}</h2>
                <p className="mt-4 text-sm leading-relaxed text-cream-200/55">{work.copy}</p>
                <span className="mt-8 inline-flex text-xs tracking-[0.2em] text-gold-300">
                  PROJEKT INDÍTÁSA →
                </span>
              </ForgedPanel>
            </button>
          ))}
        </div>

        <div className="mt-14 max-w-3xl">
          <ForgedPanel className="p-7 md:p-9">
            <p className="text-xs tracking-[0.28em] text-gold-300">NEM TUDOD, MELYIK KELL?</p>
            <h2 className="mt-3 text-2xl md:text-3xl font-serif">MONDD EL, MIT SZERETNÉL</h2>
            <p className="mt-4 text-sm leading-relaxed text-cream-200/60">
              Írd le természetes nyelven az ötletedet. A DESIGNITY munkafolyamata először meghatározza a feladat
              típusát, majd összeállítja a szükséges specialistákból álló munkafolyamatot.
            </p>
            <ForgedButton
              variant="primary"
              className="mt-7 px-7 py-3"
              onClick={() => onNavigate?.("create")}
            >
              PROJEKT INDÍTÁSA
            </ForgedButton>
          </ForgedPanel>
        </div>
      </main>
    </div>
  );
}
