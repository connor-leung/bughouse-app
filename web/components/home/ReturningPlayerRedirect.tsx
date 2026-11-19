'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { hasDisplayName } from '@/lib/identity';

// Sends players who already picked a name straight to /home. New visitors (and
// crawlers) stay on the landing page.
export default function ReturningPlayerRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (hasDisplayName()) router.replace('/home');
  }, [router]);

  return null;
}
