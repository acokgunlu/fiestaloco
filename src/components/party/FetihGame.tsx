import React from 'react';
import { Map as MapIcon } from 'lucide-react';
import { useQuizGameSocket } from '../../utils/useQuizGameSocket';
import type { FetihGameState, FetihPlayer } from '../../types/fetih';
import { QuizGameShell } from '../quiz/QuizGameShell';
import { FetihTvView } from '../fetih/FetihTvView';
import { FetihControllerView } from '../fetih/FetihControllerView';
import { t } from '../../i18n';

export const FetihGame: React.FC<{ onBackToHub: () => void }> = ({ onBackToHub }) => {
  const socket = useQuizGameSocket<FetihGameState, FetihPlayer>('fetih', { title: 'İl İl Fetih', icon: '🗺️' });
  return (
    <QuizGameShell
      socket={socket}
      slug="fetih"
      title={t('İl İl Fetih')}
      tagline={t('Bil, üret, fethet — Türkiye haritasında')}
      icon={<MapIcon className="w-6 h-6" />}
      candy="#7bd389"
      tvHint={t('Türkiye haritası büyük ekranda. Bilgiyle asker kazan, zarla üret, telefondan emir ver.')}
      onBackToHub={onBackToHub}
      renderTv={(s, leave) => (
        <FetihTvView roomCode={s.roomCode!} gameState={s.gameState!} players={s.players} send={s.send} onLeave={leave} />
      )}
      renderController={(s, hostControls, leave) => (
        <FetihControllerView roomCode={s.roomCode || ''} me={s.myPlayer!} gameState={s.gameState!} players={s.players}
          errorMessage={s.errorMessage} hostControls={hostControls} send={s.send} onLeave={leave} />
      )}
    />
  );
};
