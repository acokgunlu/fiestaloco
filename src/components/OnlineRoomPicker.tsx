import React, { useState, useEffect } from 'react';
import {
  Tv,
  Smartphone,
  Users,
  Play,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Paintbrush,
  Zap,
} from 'lucide-react';
import { CATEGORIES, DEFAULT_PLAYER_PALETTE } from '../data/wordPacks';
import { GameSettings } from '../types';

interface OnlineRoomPickerProps {
  onHostObserver: (settings: GameSettings, hostName: string) => void;
  onJoinPlayer: (roomCode: string, name: string, color: string, avatar: string, colorName: string) => void;
  onStartPassAndPlay: () => void;
  errorMessage?: string | null;
}

export const OnlineRoomPicker: React.FC<OnlineRoomPickerProps> = ({
  onHostObserver,
  onJoinPlayer,
  onStartPassAndPlay,
  errorMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'host' | 'join' | 'local'>('host');
  
  // Join form state
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('Ressam 1');
  const [selectedPaletteIdx, setSelectedPaletteIdx] = useState(0);

  // Host settings state
  const [hostRoundsPerPlayer, setHostRoundsPerPlayer] = useState(2);
  const [hostDrawTimeLimit, setHostDrawTimeLimit] = useState(25);
  const [hostCategory, setHostCategory] = useState('all');

  // Check URL query params for ?room=CODE
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setJoinRoomCode(roomParam.toUpperCase().trim());
      setActiveTab('join');
    }
  }, []);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinRoomCode.trim()) return;
    const pal = DEFAULT_PLAYER_PALETTE[selectedPaletteIdx];
    onJoinPlayer(
      joinRoomCode.trim().toUpperCase(),
      playerName.trim() || 'Ressam',
      pal.color,
      pal.avatar,
      pal.name
    );
  };

  const handleHostSubmit = () => {
    onHostObserver(
      {
        roundsPerPlayer: hostRoundsPerPlayer,
        drawTimeLimitSec: hostDrawTimeLimit,
        discussionTimeSec: 60,
        gameMode: 'different_word',
        category: hostCategory,
      },
      'Host'
    );
  };

  return (
    <div id="room-picker-container" className="w-full max-w-2xl mx-auto px-3 sm:px-4 py-6 space-y-6 animate-fade-in text-slate-900">
      {/* Brand Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-slate-700 border border-slate-200 text-xs font-black shadow-xs">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Gizli Çizim & Sahtekâr Parti Oyunu • 3 - 8 Oyuncu</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight">
          SAHTEKÂR <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-rose-600 to-purple-600">RESSAM</span>
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
          Herkes gizli kelimeyi çizer, 1 kişi <strong>Sahtekâr</strong>'dır! Sırayla tek sürekli çizgi çekin ve sahtekârı yakalayın.
        </p>
      </div>

      {/* Error Notice if any */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-800 text-xs font-black rounded-2xl text-center shadow-sm animate-shake">
          {errorMessage}
        </div>
      )}

      {/* Mode Navigation Tabs */}
      <div className="flex p-1.5 bg-slate-200/70 backdrop-blur-md rounded-2xl border border-slate-300/80 gap-1.5 shadow-sm">
        <button
          onClick={() => setActiveTab('host')}
          className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'host'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Tv className="w-4 h-4 text-indigo-500" />
          <span>Oda Aç (TV / Host)</span>
        </button>

        <button
          onClick={() => setActiveTab('join')}
          className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'join'
              ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Smartphone className="w-4 h-4 text-rose-500" />
          <span>Telefondan Katıl</span>
        </button>

        <button
          onClick={() => setActiveTab('local')}
          className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'local'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-600" />
          <span>Tek Cihaz (El Değiştir)</span>
        </button>
      </div>

      {/* TAB 1: HOST OBSERVER DISPLAY (TV / LAPTOP) */}
      {activeTab === 'host' && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xl space-y-5 animate-fade-in">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Tv className="w-5 h-5 text-indigo-600" />
              <span>TV / Ana Ekran Odası Oluştur</span>
            </h3>
            <p className="text-xs text-slate-500">
              Bu ekranı TV veya monitöre yansıtın. Diğer oyuncular telefonlarıyla QR kodu taratarak katılır!
            </p>
          </div>

          <div className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kelime Paketi / Kategori:
              </label>
              <select
                value={hostCategory}
                onChange={(e) => setHostCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="all">🌟 Tüm Kategoriler (Hayvanlar, Yiyecekler, Nesneler, Mekanlar)</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tur Başına Çizgi Sayısı:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[1, 2].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setHostRoundsPerPlayer(r)}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        hostRoundsPerPlayer === r
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20 font-black'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {r} {r === 1 ? 'Çizgi' : 'Çizgi'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Çizim Süresi Sınırı:
                </label>
                <select
                  value={hostDrawTimeLimit}
                  onChange={(e) => setHostDrawTimeLimit(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-indigo-500"
                >
                  <option value={20}>20 Saniye (Hızlı)</option>
                  <option value={25}>25 Saniye (Standart)</option>
                  <option value={35}>35 Saniye (Rahat)</option>
                  <option value={0}>Sınırsız</option>
                </select>
              </div>
            </div>
          </div>

          <button
            id="btn-create-observer-room"
            onClick={handleHostSubmit}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white font-black text-base rounded-2xl shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] mt-2"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>ODA OLUŞTUR & QR KODU GÖSTER</span>
          </button>
        </div>
      )}

      {/* TAB 2: JOIN AS PLAYER (MOBILE / PHONE) */}
      {activeTab === 'join' && (
        <form
          onSubmit={handleJoinSubmit}
          className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xl space-y-5 animate-fade-in"
        >
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-rose-500" />
              <span>Odaya Katıl (Telefon Kontrolcüsü)</span>
            </h3>
            <p className="text-xs text-slate-500">
              TV ekranında görünen 4 veya 6 haneli Oda Kodunu girin.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Oda Kodu (Örn: LION42):
              </label>
              <input
                type="text"
                value={joinRoomCode}
                onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                placeholder="KODU GİRİN"
                maxLength={8}
                required
                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 rounded-2xl px-4 py-3.5 text-xl font-mono font-black text-slate-900 tracking-widest text-center uppercase focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Oyuncu Adınız:
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Adınız"
                maxLength={16}
                required
                className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Avatar & Çizgi Rengi Seçin:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {DEFAULT_PLAYER_PALETTE.map((pal, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedPaletteIdx(idx)}
                    className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      selectedPaletteIdx === idx
                        ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <span
                      className="w-8 h-8 rounded-xl border border-white shadow-xs flex items-center justify-center text-sm"
                      style={{ backgroundColor: pal.color }}
                    >
                      {pal.avatar}
                    </span>
                    <span className="text-[10px] font-bold text-slate-700 truncate w-full text-center">
                      {pal.name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!joinRoomCode.trim()}
            className="w-full py-4 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-40 text-white font-black text-base rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            <span>ODAYA KATIL</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      )}

      {/* TAB 3: PASS & PLAY (1 DEVICE) */}
      {activeTab === 'local' && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xl space-y-5 animate-fade-in text-center">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900">Tek Cihazda Oyna (Pass & Play)</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              İkinci bir cihaza gerek olmadan, telefonu veya tableti elden ele geçirerek parti modunu oynayın!
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1.5 text-left">
            <div>✓ Tek cihaz • İnternet veya ikinci telefon gerekmez</div>
            <div>✓ Oyuncular arası gizli kart ve sıra koruma ekranı</div>
            <div>✓ Eksik oyuncular için akıllı AI Bot ressamlar</div>
            <div>✓ Turdan tura sürekli dönen dinamik çizim sırası</div>
          </div>

          <button
            onClick={onStartPassAndPlay}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base rounded-2xl shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            <Users className="w-5 h-5" />
            <span>TEK CİHAZ MODUNU BAŞLAT</span>
          </button>
        </div>
      )}

      {/* Rules Quick Reference footer */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 text-xs text-slate-600 space-y-1.5 shadow-xs">
        <div className="font-black text-slate-800 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-indigo-600" />
          <span>Nasıl Oynanır?</span>
        </div>
        <p>
          1. <strong>Gizli Kelime:</strong> Masum oyuncular aynı kelimeyi alır. Sahtekâr ise gizli kelimeyi bilmez.
        </p>
        <p>
          2. <strong>Tek Çizgi:</strong> Sırası gelen oyuncu tuvale tek bir sürekli çizgi ekler. Çizim sırası her turda döner!
        </p>
        <p>
          3. <strong>Oylama & Bonus:</strong> Şüpheli çizgiyi çizen Sahtekârı doğru bulan masum oyuncular <strong>+50 Puan</strong> kazanır!
        </p>
      </div>
    </div>
  );
};
