'use client';

import { useRouter } from 'next/navigation';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-primary mb-3 pb-2 border-b border-white/7">{title}</h2>
      {children}
    </section>
  );
}

function Rule({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex gap-3 p-3 bg-elevated rounded-xl border border-white/7">
      <span className="text-xl mt-0.5">{icon}</span>
      <div>
        <p className="text-primary font-semibold text-sm">{title}</p>
        <p className="text-secondary text-sm mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

export default function HowToPlayPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-base">
      <div className="max-w-xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-elevated hover:bg-hover border border-white/7 text-secondary hover:text-primary transition-colors"
            aria-label="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-primary tracking-tight">How to Play</h1>
            <p className="text-secondary text-sm">Bughouse Chess</p>
          </div>
        </div>

        {/* What is Bughouse */}
        <Section title="What is Bughouse?">
          <p className="text-secondary text-sm leading-relaxed">
            Bughouse is a chess variant played by <span className="text-primary font-medium">4 players in 2 teams of 2</span>, each pair playing on separate boards. Partners sit next to each other — one plays White, the other Black. The twist: captured pieces are passed to your teammate, who can drop them onto their board.
          </p>
        </Section>

        {/* Setup */}
        <Section title="Setup">
          <div className="bg-surface rounded-xl border border-white/7 p-4 text-sm text-secondary leading-relaxed">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-6 h-6 rounded-full bg-accent/20 text-accent-bright flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</div>
              <p><span className="text-primary font-medium">Team A</span> — Player 1 (White on Board 1) + Player 2 (Black on Board 2)</p>
            </div>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-6 h-6 rounded-full bg-accent/20 text-accent-bright flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</div>
              <p><span className="text-primary font-medium">Team B</span> — Player 3 (Black on Board 1) + Player 4 (White on Board 2)</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-accent/20 text-accent-bright flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</div>
              <p>Both boards play simultaneously with chess clocks running independently.</p>
            </div>
          </div>
        </Section>

        {/* The Drop Mechanic */}
        <Section title="The Drop Mechanic">
          <p className="text-secondary text-sm leading-relaxed mb-3">
            When you capture a piece, it goes to your partner's <span className="text-primary font-medium">piece reserve</span>. They can then use their turn to <span className="text-primary font-medium">drop it onto any empty square</span> instead of moving a piece on the board.
          </p>
          <div className="bg-surface rounded-xl border border-white/7 p-3 text-center">
            <p className="text-xs text-muted font-mono">You capture a knight on Board 1</p>
            <div className="flex items-center justify-center gap-2 my-2 text-lg">
              <span>♞</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-accent-bright" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              <span className="text-accent-bright text-sm font-medium">Partner's reserve</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-accent-bright" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              <span>N@f7</span>
            </div>
            <p className="text-xs text-muted font-mono">Partner drops it on Board 2 (notation: N@f7)</p>
          </div>
        </Section>

        {/* Drop Rules */}
        <Section title="Drop Rules">
          <div className="flex flex-col gap-2">
            <Rule
              icon="🚫"
              title="No pawns on rank 1 or 8"
              desc="Pawns can only be dropped on ranks 2–7. A pawn on rank 7 can still promote by advancing."
            />
            <Rule
              icon="♟"
              title="Dropped pawns can promote"
              desc="If you drop a pawn on rank 7, it can advance and promote to any piece on the next move."
            />
            <Rule
              icon="♜"
              title="Promoted pieces revert"
              desc="If a promoted piece gets captured, it returns to the opponent's reserve as a plain pawn."
            />
            <Rule
              icon="✅"
              title="You can drop into check threats"
              desc="Unlike standard chess, you can place a piece to deliver check or even checkmate immediately."
            />
          </div>
        </Section>

        {/* Winning */}
        <Section title="Winning the Game">
          <p className="text-secondary text-sm leading-relaxed mb-3">
            The match ends when <span className="text-primary font-medium">either board</span> ends — by checkmate, timeout, or resignation. Your team wins if the game ending is on your side.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-surface rounded-xl border border-white/7 p-3 text-center">
              <p className="text-success font-bold text-sm mb-1">Win</p>
              <p className="text-secondary text-xs">Checkmate or timeout on either board</p>
            </div>
            <div className="bg-surface rounded-xl border border-white/7 p-3 text-center">
              <p className="text-danger font-bold text-sm mb-1">Loss</p>
              <p className="text-secondary text-xs">Your team's board ends first by any means</p>
            </div>
          </div>
        </Section>

        {/* Strategy Tips */}
        <Section title="Strategy Tips">
          <div className="flex flex-col gap-2">
            <Rule
              icon="⚡"
              title="Attack is king"
              desc="Dropped pieces create instant threats. Constant pressure on the opponent's king is more valuable than material."
            />
            <Rule
              icon="🗣"
              title="Communicate with your partner"
              desc={'Call out what pieces you need. "Send me a knight!" or "I need a pawn to block" can win games.'}
            />
            <Rule
              icon="⏳"
              title="Stalling is a valid tactic"
              desc="Waiting (sitting) for your partner to send you the right piece before moving can swing the game."
            />
            <Rule
              icon="♗"
              title="Piece values shift"
              desc="Pawns and knights are more valuable than in standard chess. Queens and rooks are less dominant."
            />
            <Rule
              icon="🏰"
              title="Develop fast"
              desc="Open up quickly before reserves flood the board — early development is critical."
            />
          </div>
        </Section>

        {/* Notation */}
        <Section title="Drop Notation">
          <p className="text-secondary text-sm leading-relaxed mb-3">
            Drops use the <span className="text-primary font-mono text-xs bg-elevated px-1.5 py-0.5 rounded">@</span> symbol in algebraic notation:
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              ['N@f3', 'Drop knight on f3'],
              ['B@h6', 'Drop bishop on h6'],
              ['P@e5', 'Drop pawn on e5'],
              ['Q@d5', 'Drop queen on d5'],
            ].map(([notation, desc]) => (
              <div key={notation} className="flex items-center gap-2 bg-surface rounded-xl border border-white/7 p-3">
                <span className="font-mono text-accent-bright font-medium text-sm">{notation}</span>
                <span className="text-muted text-xs">{desc}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Wikipedia link */}
        <div className="mb-6 text-center">
          <a
            href="https://en.wikipedia.org/wiki/Bughouse_chess"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-primary transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Read more on Wikipedia
          </a>
        </div>

        {/* Play now CTA */}
        <div className="mt-2 mb-8">
          <button
            onClick={() => router.push('/home')}
            className="w-full bg-accent hover:bg-accent-bright rounded-xl py-4 font-bold text-base transition-colors flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(45,111,240,0.3)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L4.5 13.5H11L10 22L20.5 9.5H14L13 2Z" />
            </svg>
            Play Now
          </button>
        </div>
      </div>
    </div>
  );
}
