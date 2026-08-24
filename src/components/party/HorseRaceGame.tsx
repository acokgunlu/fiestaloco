import React, { useEffect, useState } from 'react';
import { ArrowLeft, HelpCircle, Smartphone, Tv, Users } from 'lucide-react';
import { useHorseRaceSocket } from '../../utils/useHorseRaceSocket';
import { HorseRaceTvView } from '../horserace/HorseRaceTvView';
import { HorseRaceControllerView } from '../horserace/HorseRaceControllerView';
import { HorseRacePassAndPlay } from '../horserace/HorseRacePassAndPlay';
import { DEFAULT_PLAYER_PALETTE } from '../../data/wordPacks';
import { playClickSound } from '../../utils/audio';

interface HorseRaceGameProps {
  onBackToHub: () => void;
}

export const HorseRaceGame: React.FC<HorseRaceGameProps> = ({ onBackToHub }) => {
  const [playMode, setPlayMode] = useState<'lobby' | 'online_host' | 'online_join' | 'local'>('lobby');
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [palette, setPalette] = useState(DEFAULT_PLAYER_PALETTE[0]);

  const socket = useHorseRaceSocket();

  // QR ile gelindiyse dogrudan katilim formuna dus
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) {
      setJoinCode(room.toUpperCase());
      setPlayMode('online_join');
    }
  }, []);

  if (playMode === 'online_host' && socket.roomCode && socket.gameState) {
    return (
      <HorseRaceTvView
        roomCode={socket.roomCode}
        gameState={socket.gameState}
        players={socket.players}
        onStartGame={socket.startGame}
        onNextRace={socket.nextRace}
        onRestartGame={socket.restartGame}
        onReturnToHub={() => {
          socket.leaveRoom();
          onBackToHub();
        }}
      />
    );
  }

  if (playMode === 'online_join' && socket.myPlayer && socket.gameState) {
    return (
      <HorseRaceControllerView
        roomCode={socket.roomCode || ''}
        myPlayer={socket.myPlayer}
        myBet={socket.myBet}
        gameState={socket.gameState}
        errorMessage={socket.errorMessage}
        onPlaceBet={socket.placeBet}
        onSendTaps={socket.sendTaps}
        onLeave={() => {
          socket.leaveRoom();
          setPlayMode('lobby');
        }}
      />
    );
  }

  if (playMode === 'local') {
    return <HorseRacePassAndPlay onBackToLobby={() => setPlayMode('lobby')} />;
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-fade-in text-slate-900 dark:text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHub}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-black transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Parti Arenası</span>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-lime-500 to-amber-400 text-white flex items-center justify-center text-xl shadow-md border-2 border-white dark:border-slate-700">
              🏇
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  At Yarışı
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black border border-emerald-300 dark:border-emerald-800">
                  BAHİS & REFLEKS
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                Gizlice bahsini koy, sonra telefona basarak atını koştur!
              </p>
            </div>
          </div>
        </div>
      </div>

      {playMode === 'lobby' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="flex flex-col justify-between p-7 rounded-3xl bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-900 border-2 border-emerald-500/30 hover:border-emerald-500/70 shadow-2xl transition-all group">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Tv className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">TV Ekranı (Host)</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Pisti büyük ekrana yansıtın. Oyuncular telefonlarından katılıp bahis koysun ve atlarını koştursun.
              </p>
            </div>
            <button
              onClick={() => {
                playClickSound();
                setPlayMode('online_host');
                socket.createRoom();
              }}
              className="mt-6 w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-lime-600 text-white font-black text-sm shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Tv className="w-4 h-4" />
              TV ODANI KUR
            </button>
          </div>

          <div className="flex flex-col justify-between p-7 rounded-3xl bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-900 border-2 border-amber-500/30 hover:border-amber-500/70 shadow-2xl transition-all group">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-600/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Smartphone className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Telefondan Katıl</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                TV'deki oda kodunu girin; telefonunuz hem bahis kuponunuz hem kamçınız olsun.
              </p>
            </div>
            <button
              onClick={() => {
                playClickSound();
                setPlayMode('online_join');
              }}
              className="mt-6 w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-rose-600 text-white font-black text-sm shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              ODAYA KATIL
            </button>
          </div>

          <div className="flex flex-col justify-between p-7 rounded-3xl bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-900 border-2 border-sky-500/30 hover:border-sky-500/70 shadow-2xl transition-all group">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-sky-100 dark:bg-sky-600/20 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Tek Cihaz (Bahis)</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                İnternetsiz. Atlar kendi kendine koşar, siz cihazı elden ele verip bahis koyarsınız.
              </p>
            </div>
            <button
              onClick={() => {
                playClickSound();
                setPlayMode('local');
              }}
              className="mt-6 w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-black text-sm shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Users className="w-4 h-4" />
              TEK CİHAZDA BAŞLA
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md mx-auto p-8 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-2xl">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Telefondan Odaya Katıl</h3>
            <button
              onClick={() => setPlayMode('lobby')}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold cursor-pointer"
            >
              İptal
            </button>
          </div>

          {socket.errorMessage && (
            <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs font-bold">
              {socket.errorMessage}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!joinCode.trim() || !playerName.trim()) return;
              playClickSound();
              socket.joinRoom(
                joinCode.trim().toUpperCase(),
                playerName.trim(),
                palette.avatar,
                palette.color,
                palette.name,
                'player'
              );
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Oda Kodu
              </label>
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ÖRN: RAIN75"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-amber-600 dark:text-amber-400 font-mono font-black text-lg uppercase tracking-widest text-center focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Jokey Adınız
              </label>
              <input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Adınızı yazın…"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">
                Renk Seçin
              </label>
              <div className="grid grid-cols-6 gap-2">
                {DEFAULT_PLAYER_PALETTE.map((pal) => (
                  <button
                    type="button"
                    key={pal.color}
                    onClick={() => setPalette(pal)}
                    className={`h-11 rounded-xl flex items-center justify-center text-xl transition-all cursor-pointer ${
                      palette.color === pal.color
                        ? 'ring-2 ring-slate-900 dark:ring-white scale-110 shadow-lg'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: pal.color }}
                  >
                    {pal.avatar}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!socket.isConnected}
              className="w-full mt-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-lime-600 to-amber-600 text-white font-black text-base shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {!socket.isConnected ? 'Bağlanıyor…' : 'PİSTE ÇIK'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
