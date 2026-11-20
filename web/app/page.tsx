import type { Metadata } from 'next';
import Link from 'next/link';
import ReturningPlayerRedirect from '@/components/home/ReturningPlayerRedirect';

export const metadata: Metadata = {
  title: { absolute: 'Bughouse Chess — Play 4-Player Chess Online Free' },
  description:
    'Play bughouse chess online for free. Team up with a partner, pass captured pieces, and drop them on the board in real-time 4-player chess. No account required.',
  alternates: { canonical: '/' },
};

const FEATURES = [
  {
    title: 'Real-time 4-player chess',
    desc: 'Two boards, two teams, four clocks — every move happens live.',
  },
  {
    title: 'Pass and drop pieces',
    desc: 'Anything you capture goes to your partner, who can drop it anywhere on their board.',
  },
  {
    title: 'No sign-up',
    desc: 'Pick a display name and you are in. Create a lobby or quick-play against bots.',
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-base">
      <ReturningPlayerRedirect />
      <div className="max-w-xl mx-auto px-4 py-16 flex flex-col gap-10">
        <header className="flex flex-col gap-4 text-center">
          <h1 className="text-4xl font-bold text-primary tracking-tight">Bughouse Chess Online</h1>
          <p className="text-secondary leading-relaxed">
            Bughouse is a fast, chaotic chess variant for <span className="text-primary font-medium">4 players in 2 teams</span>.
            Play it free in your browser with friends or against bots.
          </p>
          <Link
            href="/name-entry"
            className="w-full bg-accent hover:bg-accent-bright rounded-xl py-4 font-bold text-base transition-colors flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(45,111,240,0.3)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M13 2L4.5 13.5H11L10 22L20.5 9.5H14L13 2Z" />
            </svg>
            Play Now
          </Link>
        </header>

        <section className="flex flex-col gap-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="p-4 bg-elevated rounded-xl border border-white/7">
              <h2 className="text-primary font-semibold text-sm">{f.title}</h2>
              <p className="text-secondary text-sm mt-0.5">{f.desc}</p>
            </div>
          ))}
        </section>

        <section className="text-center">
          <h2 className="text-lg font-bold text-primary mb-2">New to bughouse?</h2>
          <p className="text-secondary text-sm leading-relaxed mb-3">
            Learn the setup, drop rules, and strategy tips before your first game.
          </p>
          <Link href="/how-to-play" className="text-accent-bright hover:text-primary text-sm font-medium transition-colors">
            Read how to play bughouse chess →
          </Link>
        </section>
      </div>
    </main>
  );
}
