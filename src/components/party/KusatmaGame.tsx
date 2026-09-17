import React from 'react';
import { Castle } from 'lucide-react';
import { useQuizGameSocket } from '../../utils/useQuizGameSocket';
import type { KusatmaGameState, KusatmaPlayer } from '../../types/kusatma';
import { QuizGameShell } from '../quiz/QuizGameShell';
import { KusatmaTvView } from '../kusatma/KusatmaTvView';
import { KusatmaControllerView } from '../kusatma/KusatmaControllerView';
import { t } from '../../i18n';

export const KusatmaGame: React.FC<{ onBackToHub: () => void }> = ({ onBackToHub }) => {
  const socket = useQuizGameSocket<KusatmaGameState, KusatmaPlayer>('kusatma', { title: 'Kale Kuşatması', icon: '🏰' });
  return (
    <QuizGameShell
      socket={socket}
      slug="kusatma"
      title={t('Kale Kuşatması')}
      tagline={t('İki takım, iki sur — bilgiyle yık')}
      icon={<Castle className="w-6 h-6" />}
      candy="#ff9f43"
      tvHint={t('İki kale büyük ekranda. Doğru cevaplar karşı surdan can götürür; herkes kendi telefonundan cevaplar.')}
      onBackToHub={onBackToHub}
      renderTv={(s, leave) => (
        <KusatmaTvView roomCode={s.roomCode!} gameState={s.gameState!} players={s.players} send={s.send} onLeave={leave} />
      )}
      renderController={(s, hostControls, leave) => (
        <KusatmaControllerView roomCode={s.roomCode || ''} me={s.myPlayer!} gameState={s.gameState!} players={s.players}
          errorMessage={s.errorMessage} hostControls={hostControls} send={s.send} onLeave={leave} />
      )}
    />
  );
};
