import React, { useEffect, useState } from 'react';
import { AlertTriangle, Eye, LogOut } from 'lucide-react';
import { ColoryGameState, ColoryPlayer, Hsl } from '../../types/colory';
import { defaultGuess, hslToHex } from '../../data/coloryLogic';
import { ColorPicker } from './ColorPicker';

import { t } from '../../i18n';
interface Props {
  roomCode: string;
  myPlayer: ColoryPlayer | null;
  myGuess: Hsl | null;
  gameState: ColoryGameState;
  players: ColoryPlayer[];
  errorMessage?: string | null;
  onSubmitGuess: (hsl: Hsl) => void;
  onLeave: () => void;
}

export const ColoryControllerView: React.FC<Props> = ({
  roomCode, myPlayer, myGuess, gameState, players, errorMessage, onSubmitGuess, onLeave,
}) => {
  const [pick, setPick] = useState<Hsl>(defaultGuess());

  // Her yeni turda seçiciyi sıfırla — önceki turun rengi ipucu vermesin
  useEffect(() => {
    if (gameState.phase === 'SHOWING') setPick(defaultGuess());
  }, [gameState.phase, gameState.currentRound]);

  const myResult = gameState.results?.find((r) => r.playerId === myPlayer?.id);
  const byScore = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full max-w-md mx-auto px-3 py-4 space-y-4 text-slate-900 dark:text-slate-100 animate-fade-in">
      <div className="flex items-center justify-between p-3.5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-fuchsia-200 dark:border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl text-white" style={{ backgroundColor: myPlayer?.color || '#8b5cf6' }}>
            {myPlayer?.avatar || '🎨'}
          </div>
          <div>
            <div className="font-black text-sm truncate max-w-[140px]">{myPlayer?.name}</div>
            <div className="text-xs font-mono font-black text-fuchsia-700 dark:text-fuchsia-400">{myPlayer?.score || 0} puan</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold">{roomCode}</span>
          <button onClick={onLeave} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-700 cursor-pointer">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-black">
          <AlertTriangle className="w-4 h-4 shrink-0" />{errorMessage}
        </div>
      )}

      {gameState.phase === 'LOBBY' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-lg text-center space-y-3">
          <div className="text-4xl">🎨</div>
          <h3 className="text-lg font-black">{t('Hazırsın!')}</h3>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('TV ekranından başlaması bekleniyor…')}</p>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-1 font-medium text-slate-600 dark:text-slate-300">
            <p>{t("1️⃣ TV'de bir renk çıkacak — iyi bak.")}</p>
            <p>{t('2️⃣ Renk kaybolunca burada aynısını seçmeye çalış.')}</p>
            <p>{t('3️⃣ En yakın tutturan turu alır. Az farkla kaçırmak da puan getirir.')}</p>
          </div>
        </div>
      )}

      {/*
        HEDEF RENK TELEFONDA DA GOSTERILIR — bilerek.

        TV paneliyle telefon paneli ayni rengi ayni gostermez (farkli panel
        teknolojisi, farkli renk profili, TV'nin "canli mod" doygunluk
        yukseltmesi). Oyuncu rengi TV'de gorup telefonda sectiginde, olctugumuz
        seye iki ekran arasindaki kalibrasyon farki karisiyor ve bu oyuncunun
        kontrol edemeyecegi bir hata kaynagi oluyor.
        Hedefi SECIM YAPILACAK EKRANDA gostererek o farki devreden cikariyoruz.

        Gizlilik acisindan yeni bir sey acilmiyor: sunucu SHOWING fazinda
        hedefi zaten telefona gonderiyordu (yalniz GUESSING'de gizler).
      */}
      {gameState.phase === 'SHOWING' && (
        <div className="space-y-3">
          <div
            className="relative w-full rounded-[2rem] border-8 border-white dark:border-slate-800 shadow-2xl flex items-start justify-end p-4"
            style={{ backgroundColor: gameState.target ? hslToHex(gameState.target) : '#334155', height: '52vh' }}
          >
            <span className="px-4 py-1.5 rounded-2xl bg-slate-950/70 text-white text-3xl font-black tabular-nums backdrop-blur-sm">
              {gameState.timerSeconds}
            </span>
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-lg font-black flex items-center justify-center gap-2">
              <Eye className="w-5 h-5 text-fuchsia-500" /> {t('Bu rengi aklında tut')}
            </h3>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {t('Kendi ekranında gösteriliyor — TV rengi farklı gösterebilir')}
            </p>
          </div>
        </div>
      )}

      {gameState.phase === 'GUESSING' && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black">{t('Rengi seç')}</h3>
            <span className="text-2xl font-black text-amber-500 tabular-nums">{gameState.timerSeconds}</span>
          </div>

          {myGuess ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center space-y-2">
              <p className="text-xs font-black text-emerald-800 dark:text-emerald-300">{t('SEÇİMİN ALINDI')}</p>
              <div className="w-20 h-20 mx-auto rounded-2xl border-4 border-white dark:border-slate-700 shadow-lg" style={{ backgroundColor: hslToHex(myGuess) }} />
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{t('Diğerleri bekleniyor…')}</p>
            </div>
          ) : (
            <>
              <ColorPicker value={pick} onChange={setPick} />
              <button onClick={() => onSubmitGuess(pick)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-cyan-500 text-white font-black text-base shadow-lg active:scale-95 transition-transform cursor-pointer">
                {t('BU RENK!')}</button>
            </>
          )}
        </div>
      )}

      {(gameState.phase === 'REVEAL' || gameState.phase === 'GAME_OVER') && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-lg text-center space-y-3">
          {gameState.target && myGuess && (
            <div className="flex items-center justify-center gap-3">
              <div className="space-y-1">
                <div className="w-20 h-20 rounded-2xl border-4 border-white dark:border-slate-700 shadow" style={{ backgroundColor: hslToHex(gameState.target) }} />
                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400">{t('DOĞRU')}</p>
              </div>
              <div className="space-y-1">
                <div className="w-20 h-20 rounded-2xl border-4 border-white dark:border-slate-700 shadow" style={{ backgroundColor: hslToHex(myGuess) }} />
                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400">{t('SENİN')}</p>
              </div>
            </div>
          )}
          {myResult ? (
            <>
              <h3 className="text-lg font-black">{myResult.rank}. sıradasın</h3>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">+{myResult.points}</p>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Fark ΔE {myResult.deltaE} · Toplam {myPlayer?.score}</p>
            </>
          ) : (
            <p className="text-sm font-black text-slate-500 dark:text-slate-400">{t('Bu turda seçim yapmadın')}</p>
          )}

          <div className="pt-2 space-y-1 text-left">
            {byScore.map((p, i) => (
              <div key={p.id} className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-black ${
                p.id === myPlayer?.id ? 'bg-fuchsia-100 dark:bg-fuchsia-950 text-fuchsia-800 dark:text-fuchsia-300' : 'bg-slate-50 dark:bg-slate-800/60'}`}>
                <span>{i + 1}. {p.avatar} {p.name}</span>
                <span className="font-mono">{p.score}</span>
              </div>
            ))}
          </div>

          {gameState.phase === 'GAME_OVER' && gameState.winnerPlayerId === myPlayer?.id && (
            <p className="text-sm font-black text-amber-500">{t('🏆 Renk ustası sensin!')}</p>
          )}
        </div>
      )}
    </div>
  );
};
