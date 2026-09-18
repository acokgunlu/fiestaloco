import React from 'react';
import { Orbit } from 'lucide-react';
import { useQuizGameSocket } from '../../utils/useQuizGameSocket';
import type { FetihGameState, FetihPlayer } from '../../types/fetih';
import { QuizGameShell } from '../quiz/QuizGameShell';
import { FetihTvView } from '../fetih/FetihTvView';
import { FetihControllerView } from '../fetih/FetihControllerView';
import { t } from '../../i18n';

export const FetihGame: React.FC<{ onBackToHub: () => void }> = ({ onBackToHub }) => {
  const socket = useQuizGameSocket<FetihGameState, FetihPlayer>('fetih', { title: 'Galaksi', icon: '🌌' });
  return (
    <QuizGameShell
      socket={socket}
      slug="galaksi"
      title={t('Galaksi')}
      tagline={t('Sisli galakside sektör sektör fetih')}
      icon={<Orbit className="w-6 h-6" />}
      candy="#b892ff"
      tvHint={t('Sisli galaksi büyük ekranda. Soruyla enerji kazan, telefondaki pusulayla komşu sektörlere ilerle; rakibe girersen 4 şıklı düello.')}
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
