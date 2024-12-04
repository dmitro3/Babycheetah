import { Suspense } from 'react';
import GameClient from './game-client';
import TelegramInitializer from './TelegramInitializer';

export default function Home() {
  return (
    <main>
      <TelegramInitializer />
      <Suspense fallback={<div>Loading...</div>}>
        <GameClient />
      </Suspense>
    </main>
  );
}
