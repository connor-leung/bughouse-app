import type { Metadata } from 'next';
import LegalPage, { CONTACT_URL, LegalLink, LegalList, LegalSection } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'What Bughouse Chess stores, what it shares, and the choices you have.',
  alternates: { canonical: 'https://bughouse-app.vercel.app/privacy' },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <LegalSection title="Summary">
        <p>
          Bughouse Chess has no accounts and no database. You pick a display name, and it stays in your browser.
          Games and chat exist only in the game server&apos;s memory while they&apos;re running. The site uses Google
          Analytics to count visits.
        </p>
      </LegalSection>

      <LegalSection title="What is stored in your browser">
        <p>The site uses your browser&apos;s local storage to keep:</p>
        <LegalList>
          <li>A random player ID, generated the first time you visit, so the server can tell your moves apart from other players&apos;.</li>
          <li>The display name you choose.</li>
          <li>The result of games you&apos;ve finished, so the end-of-game screen survives a page reload.</li>
        </LegalList>
        <p>
          You can delete all of this at any time by clearing this site&apos;s data in your browser settings. You&apos;ll
          get a new player ID next time you play.
        </p>
      </LegalSection>

      <LegalSection title="What the game server receives">
        <p>When you play, your browser sends the game server your player ID, display name, moves, and any team chat messages.</p>
        <LegalList>
          <li>Your display name is visible to the other players in your lobby and game, and to anyone browsing open lobbies.</li>
          <li>Team chat is only sent to your teammate.</li>
          <li>
            Games, lobbies and chat are held in memory only. They are not written to a database and are gone when the
            server restarts.
          </li>
          <li>
            Server logs record player IDs and game IDs for debugging. They don&apos;t record display names or chat.
            Our hosting providers may also log IP addresses as part of normal operation.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="Analytics">
        <p>
          The site uses <LegalLink href="https://policies.google.com/technologies/partner-sites">Google Analytics</LegalLink>{' '}
          to understand how many people visit and which pages they use. Google Analytics sets cookies and collects
          information such as pages viewed, approximate location derived from your IP address, and your browser and
          device type. We don&apos;t send it your display name or chat messages.
        </p>
        <p>
          You can opt out with Google&apos;s{' '}
          <LegalLink href="https://tools.google.com/dlpage/gaoptout">opt-out browser add-on</LegalLink>, or by blocking
          cookies for this site.
        </p>
      </LegalSection>

      <LegalSection title="Service providers">
        <LegalList>
          <li><LegalLink href="https://vercel.com/legal/privacy-policy">Vercel</LegalLink> hosts the website.</li>
          <li><LegalLink href="https://fly.io/legal/privacy-policy">Fly.io</LegalLink> hosts the game server, in Toronto, Canada.</li>
          <li><LegalLink href="https://policies.google.com/privacy">Google</LegalLink> provides analytics and serves the site&apos;s fonts.</li>
        </LegalList>
        <p>We don&apos;t sell or rent your information, and we don&apos;t share it with anyone else.</p>
      </LegalSection>

      <LegalSection title="Children">
        <p>The site isn&apos;t directed at children under 13, and we don&apos;t knowingly collect personal information from them.</p>
      </LegalSection>

      <LegalSection title="Changes and contact">
        <p>
          If this policy changes, the new version will be posted here with a new effective date. Questions can be sent
          through <LegalLink href={CONTACT_URL}>GitHub</LegalLink>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
