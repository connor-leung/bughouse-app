import Link from 'next/link';

export const EFFECTIVE_DATE = 'November 18, 2026';
export const CONTACT_URL = 'https://github.com/connor-leung';

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-primary mb-3 pb-2 border-b border-white/7">{title}</h2>
      <div className="text-secondary text-sm leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export function LegalList({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-5 space-y-1.5">{children}</ul>;
}

export function LegalLink({ href, children }: { href: string; children: React.ReactNode }) {
  const className = 'text-accent-bright hover:underline';
  if (href.startsWith('/')) {
    return <Link href={href} className={className}>{children}</Link>;
  }
  return (
    <a href={href} className={className} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export default function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-base">
      <div className="max-w-xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/home"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-elevated hover:bg-hover border border-white/7 text-secondary hover:text-primary transition-colors"
            aria-label="Back to home"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-primary tracking-tight">{title}</h1>
            <p className="text-secondary text-sm">Effective {EFFECTIVE_DATE}</p>
          </div>
        </div>

        {children}

        {/* Footer */}
        <nav className="mt-10 pt-6 border-t border-white/7 flex justify-center gap-6 text-sm text-muted">
          <Link href="/privacy" className="hover:text-secondary transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-secondary transition-colors">Terms of Service</Link>
          <Link href="/how-to-play" className="hover:text-secondary transition-colors">How to Play</Link>
        </nav>
      </div>
    </div>
  );
}
