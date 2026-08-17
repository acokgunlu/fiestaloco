import React, { useState, useEffect } from 'react';
import {
  Tv,
  Smartphone,
  Users,
  Play,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Shield,
  UserCheck,
  Eye,
  Shuffle,
  Flame,
} from 'lucide-react';
import { CODENAMES_CATEGORIES } from '../../data/codenamesWords';
import { CodenamesSettings, CodenamesTeam, CodenamesRole } from '../../types/codenames';
import { playClickSound, playTurnSound } from '../../utils/audio';

interface CodenamesOnlinePickerProps {
  onHostTvRoom: (settings: CodenamesSettings) => void;
  onJoinMobileRoom: (
    roomCode: string,
    playerName: string,
    team: CodenamesTeam,
    role: CodenamesRole
  ) => void;
  onStartLocalPassAndPlay: (settings: CodenamesSettings) => void;
  onOpenRules: () => void;
  onBackToHub: () => void;
  errorMessage?: string | null;
}

export function CodenamesOnlinePicker({
  onHostTvRoom,
  onJoinMobileRoom,
  onStartLocalPassAndPlay,
  onOpenRules,
  onBackToHub,
  errorMessage,
}: CodenamesOnlinePickerProps) {
  const [activeTab, setActiveTab] = useState<'tv_host' | 'join_phone' | 'local'>('tv_host');

  // TV Host Settings State
  const [hostCategory, setHostCategory] = useState('all');
  const [hostStartingTeam, setHostStartingTeam] = useState<'random' | 'red' | 'blue'>('random');
  const [hostTimerSeconds, setHostTimerSeconds] = useState(0);

  // Mobile Join State
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('Ajan 1');
  const [selectedTeam, setSelectedTeam] = useState<CodenamesTeam>('red');
  const [selectedRole, setSelectedRole] = useState<CodenamesRole>('operative');

  // Local Pass & Play State
  const [localCategory, setLocalCategory] = useState('all');
  const [localStartingTeam, setLocalStartingTeam] = useState<'random' | 'red' | 'blue'>('random');

  // URL query check for ?room=CODE
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setJoinRoomCode(roomParam.toUpperCase().trim());
      setActiveTab('join_phone');
    }
  }, []);

  const handleTvHostSubmit = () => {
    playTurnSound();
    onHostTvRoom({
      startingTeam: hostStartingTeam,
      category: hostCategory,
      timerSeconds: hostTimerSeconds,
      aiSpymaster: false,
    });
  };

  const handleMobileJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinRoomCode.trim()) return;
    playTurnSound();
    onJoinMobileRoom(
      joinRoomCode.trim().toUpperCase(),
      playerName.trim() || 'Ajan',
      selectedTeam,
      selectedRole
    );
  };

  const handleLocalSubmit = () => {
    playTurnSound();
    onStartLocalPassAndPlay({
      startingTeam: localStartingTeam,
      category: localCategory,
      timerSeconds: 0,
      aiSpymaster: false,
    });
  };

  return (
    <div
      id="codenames-online-picker"
      className="w-full max-w-2xl mx-auto px-3 sm:px-4 py-6 space-y-6 animate-fade-in text-slate-900"
    >
      {/* Brand Hero Header */}
      <div className="text-center space-y-2.5">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-slate-700 border border-slate-200 text-xs font-black shadow-xs">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Gizli İstihbarat & İpucu Arenası • 2 - 12+ Oyuncu</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          GİZLİ <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-purple-600 to-sky-600">AJANLAR</span>
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
          TV veya büyük ekrana yansıtın, <strong>Kırmızı vs Mavi Takım</strong> telefonlarıyla katılıp gizli renkleri çözsün!
        </p>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-800 text-xs font-black rounded-2xl text-center shadow-xs animate-shake">
          {errorMessage}
        </div>
      )}

      {/* Mode Navigation Tabs */}
      <div className="flex p-1.5 bg-slate-200/80 backdrop-blur-md rounded-2xl border border-slate-300/80 gap-1.5 shadow-xs">
        <button
          onClick={() => {
            playClickSound();
            setActiveTab('tv_host');
          }}
          className={`flex-1 py-3 px-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'tv_host'
              ? 'bg-gradient-to-r from-red-600 to-sky-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span>TV / Ekran Aç (Host)</span>
        </button>

        <button
          onClick={() => {
            playClickSound();
            setActiveTab('join_phone');
          }}
          className={`flex-1 py-3 px-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'join_phone'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Telefondan Katıl</span>
        </button>

        <button
          onClick={() => {
            playClickSound();
            setActiveTab('local');
          }}
          className={`flex-1 py-3 px-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'local'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Tek Cihaz (Masa)</span>
        </button>
      </div>

      {/* TAB 1: TV HOST (BIG SCREEN DISPLAY) */}
      {activeTab === 'tv_host' && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xl space-y-5 animate-fade-in">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Tv className="w-5 h-5 text-indigo-600" />
              <span>TV / Masaüstü Ekranı İçin Oda Aç</span>
            </h3>
            <p className="text-xs text-slate-500">
              Bu ekranı TV veya büyük ekrana yansıtın. 25 kartlık ahşap masa panosu TV'de görünür, oyuncular telefonlarıyla liderlik eder veya tahmin yapar!
            </p>
          </div>

          <div className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kelime Havuzu & Tema:
              </label>
              <select
                value={hostCategory}
                onChange={(e) => setHostCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-hidden focus:border-indigo-500"
              >
                {CODENAMES_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Başlangıç Takımı (9 Ajan):
                </label>
                <select
                  value={hostStartingTeam}
                  onChange={(e) => setHostStartingTeam(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-hidden"
                >
                  <option value="random">🎲 Rastgele Takım</option>
                  <option value="red">🔴 Kırmızı Takım</option>
                  <option value="blue">🔵 Mavi Takım</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tur Süresi:
                </label>
                <select
                  value={hostTimerSeconds}
                  onChange={(e) => setHostTimerSeconds(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-hidden"
                >
                  <option value={0}>Sınırsız (Rahat Mod)</option>
                  <option value={60}>60 Saniye (Hızlı)</option>
                  <option value={90}>90 Saniye (Standart)</option>
                  <option value={120}>120 Saniye (Taktiksel)</option>
                </select>
              </div>
            </div>
          </div>

          <button
            id="btn-create-codenames-tv-room"
            onClick={handleTvHostSubmit}
            className="w-full py-4 bg-gradient-to-r from-red-600 via-purple-600 to-sky-600 hover:from-red-500 hover:to-sky-500 text-white font-black text-base rounded-2xl shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] mt-2"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>TV ODASI AÇ & QR KODU GÖSTER</span>
          </button>
        </div>
      )}

      {/* TAB 2: JOIN FROM PHONE */}
      {activeTab === 'join_phone' && (
        <form
          onSubmit={handleMobileJoinSubmit}
          className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xl space-y-5 animate-fade-in"
        >
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-purple-600" />
              <span>Telefondan Katıl (Kumanda & Harita)</span>
            </h3>
            <p className="text-xs text-slate-500">
              TV ekranındaki 4 veya 6 haneli Oda Kodunu girin, takımınızı ve rolünüzü seçin!
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Oda Kodu (TV'deki Kod):
              </label>
              <input
                type="text"
                value={joinRoomCode}
                onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                placeholder="ÖRN: LION42"
                maxLength={8}
                required
                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-purple-500 rounded-2xl px-4 py-3.5 text-xl font-mono font-black text-slate-900 tracking-widest text-center uppercase focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Oyuncu / Kod Adınız:
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Ajan Adınız"
                maxLength={16}
                required
                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-hidden"
              />
            </div>

            {/* Team Selection (Red vs Blue) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Takım Seçin:
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setSelectedTeam('red');
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    selectedTeam === 'red'
                      ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔴</span>
                    <div>
                      <div className="text-xs font-black text-rose-950">Kırmızı Takım</div>
                      <div className="text-[10px] text-rose-700">Ajan Timi</div>
                    </div>
                  </div>
                  {selectedTeam === 'red' && <span className="text-rose-600 font-black">✓</span>}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setSelectedTeam('blue');
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    selectedTeam === 'blue'
                      ? 'bg-sky-50 border-sky-500 ring-2 ring-sky-500/20'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔵</span>
                    <div>
                      <div className="text-xs font-black text-sky-950">Mavi Takım</div>
                      <div className="text-[10px] text-sky-700">Ajan Timi</div>
                    </div>
                  </div>
                  {selectedTeam === 'blue' && <span className="text-sky-600 font-black">✓</span>}
                </button>
              </div>
            </div>

            {/* Role Selection (Spymaster vs Operative) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Rolünüzü Belirleyin:
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setSelectedRole('spymaster');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedRole === 'spymaster'
                      ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-sm font-black text-amber-950 flex items-center gap-1.5">
                    <span>👑</span>
                    <span>Ajan Lideri (Spymaster)</span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1">
                    Telefonunuzda gizli renk haritası görünür. İpucu verirsiniz.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setSelectedRole('operative');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedRole === 'operative'
                      ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-sm font-black text-indigo-950 flex items-center gap-1.5">
                    <span>🕵️‍♂️</span>
                    <span>Saha Ajanı (Operative)</span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1">
                    İpuçlarını tartışıp TV'deki kartları telefonunuzdan açarsınız.
                  </p>
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!joinRoomCode.trim()}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white font-black text-base rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            <span>AJAN ODASINA GİRİŞ YAP</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      )}

      {/* TAB 3: LOCAL PASS & PLAY */}
      {activeTab === 'local' && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xl space-y-5 animate-fade-in text-center">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900">Tek Ekranda Masaüstü Oyunu</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Tablet veya bilgisayarınızı masanın ortasına koyun, liderler sırayla "Lider Haritası"na bakarak fiziksel ortamda ipucu versin!
            </p>
          </div>

          <div className="space-y-3 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kategori Seçimi:
              </label>
              <select
                value={localCategory}
                onChange={(e) => setLocalCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-hidden"
              >
                {CODENAMES_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleLocalSubmit}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base rounded-2xl shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>TEK EKRANDA OYUNU BAŞLAT</span>
          </button>
        </div>
      )}

      {/* Footer Navigation Bar */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => {
            playClickSound();
            onBackToHub();
          }}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
        >
          <span>← Parti Kulübü Ana Menü</span>
        </button>

        <button
          onClick={() => {
            playClickSound();
            onOpenRules();
          }}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Nasıl Oynanır & Kurallar</span>
        </button>
      </div>
    </div>
  );
}
