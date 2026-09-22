export default function Projects() {
  return <Placeholder title="Projects" />;
}

function Placeholder({ title }: { title: string }) {
  return (
    <div>
      <h1 className="font-display text-3xl text-cream-100">{title}</h1>
      <p className="mt-2 text-sm text-cream-300/60">Wired up next.</p>
    </div>
  );
}
