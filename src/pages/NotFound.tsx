import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center text-center">
      <span className="font-display text-6xl text-gold-600/40">404</span>
      <h1 className="mt-4 font-display text-2xl text-cream-100">This page does not exist</h1>
      <p className="mt-3 text-sm text-cream-300/60">
        The link may be out of date, or the page may not have moved across yet.
      </p>
      <Link
        to="/"
        className="mt-8 rounded-lg bg-gold-600 px-5 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-gold-500"
      >
        Back to the landing page
      </Link>
    </div>
  );
}
