import type { Metadata } from 'next';
import HomeMenu from '@/components/home/HomeMenu';

export const metadata: Metadata = {
  title: 'Play',
  description: 'Start a quick bughouse game against bots or browse open lobbies to play with friends.',
  alternates: { canonical: '/home' },
};

export default function HomePage() {
  return <HomeMenu />;
}
