'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { hasDisplayName } from '@/lib/identity';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    if (hasDisplayName()) {
      router.replace('/home');
    } else {
      router.replace('/name-entry');
    }
  }, [router]);

  return null;
}
