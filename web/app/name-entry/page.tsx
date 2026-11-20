import type { Metadata } from 'next';
import NameEntryForm from '@/components/home/NameEntryForm';

export const metadata: Metadata = {
  title: 'Choose a Display Name',
  robots: { index: false, follow: true },
};

export default function NameEntryPage() {
  return <NameEntryForm />;
}
