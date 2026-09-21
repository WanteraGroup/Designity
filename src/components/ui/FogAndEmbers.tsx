export function FogAndEmbers() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden="true">
      {/* Füst */}
      <div
        className="absolute -inset-[12%] bg-[radial-gradient(ellipse_at_20%_30%,rgba(190,220,214,.12),transparent_28%),radial-gradient(ellipse_at_72%_42%,rgba(132,163,157,.10),transparent_32%),radial-gradient(ellipse_at_42%_78%,rgba(238,232,220,.07),transparent_30%)] opacity-[0.55] animate-[fogMove_18s_linear_infinite]"
      />

      {/* Köd réteg */}
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_62%),linear-gradient(180deg,rgba(156,238,229,.04),transparent_42%,rgba(214,179,106,.03))] opacity-[0.55]"
      />

      {/* Parázs szemcsék */}
      <div
        className="absolute inset-[-10%] opacity-[0.34] animate-[embersFloat_12s_linear_infinite]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 8% 76%, rgba(214,179,106,.9) 0 1px, transparent 2px), radial-gradient(circle at 16% 42%, rgba(244,208,132,.72) 0 1px, transparent 2px), radial-gradient(circle at 27% 66%, rgba(214,179,106,.85) 0 1px, transparent 2px), radial-gradient(circle at 39% 28%, rgba(238,232,220,.56) 0 1px, transparent 2px), radial-gradient(circle at 51% 72%, rgba(214,179,106,.8) 0 1.2px, transparent 2.4px), radial-gradient(circle at 63% 36%, rgba(244,208,132,.68) 0 1px, transparent 2px), radial-gradient(circle at 74% 64%, rgba(214,179,106,.9) 0 1px, transparent 2px), radial-gradient(circle at 84% 24%, rgba(238,232,220,.5) 0 1px, transparent 2px), radial-gradient(circle at 92% 78%, rgba(214,179,106,.82) 0 1px, transparent 2px)',
          backgroundSize: '100% 100%',
        }}
      />
    </div>
  );
}

export default FogAndEmbers;
