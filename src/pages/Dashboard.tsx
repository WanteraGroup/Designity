import { useAuth } from '@/lib/auth';
import { GENERATION_COSTS } from '@/lib/constants';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { profile } = useAuth();

  return (
    <div>
      <header className="mb-10">
        <h1 className="font-display text-3xl text-cream-100">
          {profile?.full_name ? `Welcome back, ${profile.full_name}` : 'Welcome back'}
        </h1>
        <p className="mt-2 text-sm text-cream-300/60">
          {profile?.unlimited_access
            ? 'Unlimited access — go ahead.'
            : `${profile?.credits ?? 0} credits available.`}
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <Link
          to="/app/create"
          className="group rounded-xl border border-gold-700/25 bg-ink-850/60 p-7 transition hover:border-gold-600/50"
        >
          <h2 className="font-display text-xl text-cream-100">Start something new</h2>
          <p className="mt-2 text-sm text-cream-300/60">
            Describe what you want and the AI team builds it.
          </p>
          <span className="mt-5 inline-block text-sm text-gold-300 group-hover:text-gold-200">
            Create →
          </span>
        </Link>

        <Link
          to="/app/projects"
          className="rounded-xl border border-gold-700/25 bg-ink-850/60 p-7 transition hover:border-gold-600/50"
        >
          <h2 className="font-display text-xl text-cream-100">Your projects</h2>
          <p className="mt-2 text-sm text-cream-300/60">Everything you have generated, in one place.</p>
        </Link>

        <Link
          to="/app/credits"
          className="rounded-xl border border-gold-700/25 bg-ink-850/60 p-7 transition hover:border-gold-600/50"
        >
          <h2 className="font-display text-xl text-cream-100">Credits</h2>
          <p className="mt-2 text-sm text-cream-300/60">Top up or change plan.</p>
        </Link>
      </div>

      <section className="mt-12">
        <h2 className="mb-4 font-display text-xl text-cream-100">What things cost</h2>
        <div className="overflow-hidden rounded-xl border border-gold-700/20">
          <table className="w-full text-sm">
            <tbody>
              {GENERATION_COSTS.map((c) => (
                <tr key={c.type} className="border-b border-gold-700/10 last:border-0">
                  <td className="px-4 py-2.5 text-cream-200">{c.label}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs text-gold-400">
                    {c.credits} cr
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
