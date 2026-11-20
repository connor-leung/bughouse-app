import type { Metadata } from 'next';
import LegalPage, { CONTACT_URL, LegalLink, LegalList, LegalSection } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms for playing Bughouse Chess.',
  alternates: { canonical: 'https://bughouse-app.vercel.app/terms' },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <LegalSection title="Using the site">
        <p>
          Bughouse Chess is a free online game. By using the site you agree to these terms. If you don&apos;t agree,
          please don&apos;t use it.
        </p>
      </LegalSection>

      <LegalSection title="Display names and chat">
        <p>Other players see your display name and team chat. Please don&apos;t use either to:</p>
        <LegalList>
          <li>Harass, threaten or insult other players.</li>
          <li>Post hateful, sexual or otherwise offensive content.</li>
          <li>Impersonate another person.</li>
          <li>Share other people&apos;s personal information.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="Fair use of the service">
        <p>Please don&apos;t:</p>
        <LegalList>
          <li>Try to disrupt, overload or gain unauthorized access to the site or game server.</li>
          <li>Use scripts or automated tools to create lobbies, join games or send messages.</li>
          <li>Exploit bugs to gain an advantage. If you find one, please report it instead.</li>
        </LegalList>
        <p>We may remove lobbies, end games or block access for anyone who breaks these terms.</p>
      </LegalSection>

      <LegalSection title="Availability">
        <p>
          The site is a personal project and may change, go offline or lose games in progress (for example, when the
          server restarts) at any time, without notice.
        </p>
      </LegalSection>

      <LegalSection title="Source code">
        <p>
          The source code is published on{' '}
          <LegalLink href="https://github.com/connor-leung/bughouse-app">GitHub</LegalLink> for viewing only. All rights
          are reserved; see the repository&apos;s LICENSE file. Playing the game doesn&apos;t give you any right to copy,
          modify or redistribute the code.
        </p>
      </LegalSection>

      <LegalSection title="No warranty">
        <p>
          The site is provided &quot;as is&quot;, without warranties of any kind. To the fullest extent permitted by law,
          we aren&apos;t liable for any damages arising from your use of the site, including lost games or results.
        </p>
      </LegalSection>

      <LegalSection title="Privacy">
        <p>
          The <LegalLink href="/privacy">Privacy Policy</LegalLink> explains what the site stores and shares.
        </p>
      </LegalSection>

      <LegalSection title="Changes and contact">
        <p>
          These terms may be updated; the new version will be posted here with a new effective date. Continuing to use
          the site means you accept the updated terms. Questions can be sent through{' '}
          <LegalLink href={CONTACT_URL}>GitHub</LegalLink>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
