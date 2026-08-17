import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  Award,
  HelpCircle,
  Users,
  Lightbulb,
  Skull,
  ArrowRight,
  Tv,
  Smartphone,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { playClickSound } from '../../utils/audio';

interface CodenamesRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CodenamesRulesModal({ isOpen, onClose }: CodenamesRulesModalProps) {
  const [activeTab, setActiveTab] = useState<'basics' | 'spymaster' | 'operatives' | 'tv_mode' | 'assassin'>('basics');

  if (!isOpen) return null;

  return (
    <div
      id="codenames-rules-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in"
      onClick={() => {
        playClickSound();
        onClose();
      }}
    >
      <div
        className="bg-white text-slate-900 rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-500 to-sky-600 text-white flex items-center justify-center text-xl font-black shadow-md">
              🕵️‍♂️
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Gizli Ajanlar (Codenames) Oyun Rehberi
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Takım Stratejisi • İpucu Verme • TV Host & Telefon Kumandası
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex p-1 bg-slate-100 rounded-2xl gap-1 mt-4 overflow-x-auto text-xs font-bold text-slate-600 shrink-0">
          <button
            onClick={() => {
              playClickSound();
              setActiveTab('basics');
            }}
            className={`py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'basics' ? 'bg-white text-slate-900 shadow-xs font-black' : 'hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>1. Temel Amaç</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              setActiveTab('spymaster');
            }}
            className={`py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'spymaster' ? 'bg-white text-slate-900 shadow-xs font-black' : 'hover:text-slate-900'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>2. Lider (Spymaster)</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              setActiveTab('operatives');
            }}
            className={`py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'operatives' ? 'bg-white text-slate-900 shadow-xs font-black' : 'hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>3. Saha Ajanları</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              setActiveTab('tv_mode');
            }}
            className={`py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'tv_mode' ? 'bg-white text-slate-900 shadow-xs font-black' : 'hover:text-slate-900'
            }`}
          >
            <Tv className="w-3.5 h-3.5 text-rose-500" />
            <span>4. TV & Telefon Modu</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              setActiveTab('assassin');
            }}
            className={`py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'assassin' ? 'bg-white text-slate-900 shadow-xs font-black' : 'hover:text-slate-900'
            }`}
          >
            <Skull className="w-3.5 h-3.5 text-stone-700" />
            <span>5. Suikastçı Tuzağı</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto py-4 space-y-4 text-xs sm:text-sm text-slate-700 pr-1 grow">
          {/* TAB 1: BASICS */}
          {activeTab === 'basics' && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-red-50 to-blue-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Oyunun Temel Amacı</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  İki rakip takım (<strong>🔴 Kırmızı Takım</strong> ve <strong>🔵 Mavi Takım</strong>) 5x5 boyutundaki 25 kelimelik masada gizli ajanlarını arar. Masadaki tüm kendi ajanlarını düşmandan önce açığa çıkaran takım oyunu kazanır!
                </p>
              </div>

              {/* Card Distribution Matrix */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">
                  5x5 Masadaki 25 Kartın Gizli Dağılımı:
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-3 rounded-xl bg-red-100 border border-red-200 text-red-950">
                    <div className="text-xl">🔴</div>
                    <div className="font-black text-red-800 text-sm mt-1">8 veya 9 Ajan</div>
                    <div className="text-[11px] text-red-700 font-bold">Kırmızı Takım</div>
                  </div>
                  <div className="p-3 rounded-xl bg-sky-100 border border-sky-200 text-sky-950">
                    <div className="text-xl">🔵</div>
                    <div className="font-black text-sky-800 text-sm mt-1">8 veya 9 Ajan</div>
                    <div className="text-[11px] text-sky-700 font-bold">Mavi Takım</div>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950">
                    <div className="text-xl">⚪</div>
                    <div className="font-black text-amber-800 text-sm mt-1">7 Sivil</div>
                    <div className="text-[11px] text-amber-700 font-bold">Masum Seyirci</div>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 text-white">
                    <div className="text-xl">☠️</div>
                    <div className="font-black text-rose-400 text-sm mt-1">1 Suikastçı</div>
                    <div className="text-[11px] text-stone-300 font-bold">Anında Kaybettirir!</div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-900 space-y-1">
                <div className="font-black flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Başlangıç Avantajı (9 Ajan)</span>
                </div>
                <p className="text-xs text-indigo-800 leading-relaxed">
                  İlk başlayan takımın bulması gereken 9 ajanı vardır; ikinci başlayan takımın ise 8 ajanı bulunur.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: SPYMASTER */}
          {activeTab === 'spymaster' && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-black text-amber-950 text-sm">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span>Ajan Lideri (Spymaster) Nasıl Oynar?</span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  Ajan lideri tüm kartların gizli kimliklerini (Kırmızı, Mavi, Sivil, Suikastçı) görür. Görevi, kendi ajanlarına masadaki kartları bağdaştıran tek kelimelik bir ipucu ve sayı vermektir.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">
                  Altın İpucu Kuralları:
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Format: TEK KELİME + SAYI</strong>
                      <p className="text-slate-600 mt-0.5">
                        Örnek: <em>"HAYVAN, 3"</em> (Masadaki ASLAN, KARTAL, KURT kelimelerini bağlamak için).
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">YASAK: Masadaki Kelimelerin Kökünü Kullanmak</strong>
                      <p className="text-slate-600 mt-0.5">
                        Eğer masada <em>"GÖZLÜK"</em> varsa <em>"GÖZ"</em> ipucu verilemez. Aynı şekilde eşsesli/harf benzerliği hilesi yapılamaz.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Gizli Mimik ve İpucu Vermek Yasaktır</strong>
                      <p className="text-slate-600 mt-0.5">
                        Lider sadece ipucu kelimesini ve sayıyı söyler. Göz kırpma, parmakla işaret etme veya tepki verme kural dışıdır.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: OPERATIVES */}
          {activeTab === 'operatives' && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 space-y-2">
                <div className="flex items-center gap-2 font-black text-sky-950 text-sm">
                  <Users className="w-4 h-4 text-sky-600" />
                  <span>Saha Ajanları (Operatives) Nasıl Oynar?</span>
                </div>
                <p className="text-xs text-sky-900 leading-relaxed">
                  Saha ajanları masadaki kelimeleri görür ancak renkleri bilmez. Liderin ipucunu aralarında tartışarak en mantıklı kartı seçip açarlar.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">
                  Kart Açıldığında Ne Olur?
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <span className="font-black text-emerald-900">✅ Kendi Renginiz Çıkarsa:</span>
                    <p className="text-emerald-800 mt-1">
                      Puan kazanırsınız ve kalan tahmin hakkınız kadar yeni bir kart açmaya devam edebilirsiniz.
                    </p>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <span className="font-black text-amber-900">⚪ Masum Sivil Çıkarsa:</span>
                    <p className="text-amber-800 mt-1">
                      Turunuz anında sona erer. Sıra karşı takıma geçer.
                    </p>
                  </div>
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                    <span className="font-black text-rose-900">🔴/🔵 Karşı Takım Çıkarsa:</span>
                    <p className="text-rose-800 mt-1">
                      Karşı takıma bedava 1 ajan kazandırmış olursunuz ve turunuz anında biter!
                    </p>
                  </div>
                  <div className="p-3 bg-stone-900 border border-stone-800 rounded-xl text-white">
                    <span className="font-black text-rose-400">☠️ Kara Suikastçı Çıkarsa:</span>
                    <p className="text-stone-300 mt-1">
                      Oyun anında biter ve takımınız direkt kaybeder!
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-700">
                💡 <strong>Tahmin Sayısı Bonusu:</strong> Lider <em>"3"</em> dediyse, takımınız en fazla <strong>3 + 1 = 4</strong> tahmin yapabilir. İstediğiniz an <em>"Turu Bitir"</em> diyerek sırayı devredebilirsiniz.
              </div>
            </div>
          )}

          {/* TAB 4: TV & TELEFON MODU */}
          {activeTab === 'tv_mode' && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 space-y-2">
                <div className="flex items-center gap-2 font-black text-indigo-950 text-sm">
                  <Tv className="w-4 h-4 text-indigo-600" />
                  <span>TV Ekranı & Akıllı Telefon Kumandası Modu</span>
                </div>
                <p className="text-xs text-indigo-900 leading-relaxed">
                  Oyununuzu TV veya büyük ekrana yansıtıp oturma odanızda gerçek bir oyun gecesi düzenleyin!
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center text-xs shrink-0">
                    1
                  </div>
                  <div>
                    <h5 className="font-black text-slate-900 text-xs">TV'de "Oda Aç (TV / Host)" Seçeneğini Seçin</h5>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Büyük ekranda 25 kartlık ahşap masa panosu ve 4 haneli oda kodu belirir.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="w-7 h-7 rounded-full bg-rose-600 text-white font-black flex items-center justify-center text-xs shrink-0">
                    2
                  </div>
                  <div>
                    <h5 className="font-black text-slate-900 text-xs">Oyuncular Telefonlarından Katılır</h5>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Telefon tarayıcısından oda kodunu girip Takımlarını (Kırmızı/Mavi) ve Rollerini (Lider veya Saha Ajanı) seçerler.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-xs shrink-0">
                    3
                  </div>
                  <div>
                    <h5 className="font-black text-slate-900 text-xs">Gizli Lider Haritası Telefon Ekranında Görünür</h5>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Liderlerin telefonunda 5x5 renkli anahtar matrisi ve ipucu kutusu açılır. Saha ajanları ise kelimeleri görüp TV'deki kartları canlı olarak çevirebilir!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ASSASSIN */}
          {activeTab === 'assassin' && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
                <div className="flex items-center gap-2 font-black text-rose-950 text-sm">
                  <Skull className="w-4 h-4 text-rose-600" />
                  <span>Kara Suikastçı (The Assassin) Hakkında</span>
                </div>
                <p className="text-xs text-rose-900 leading-relaxed">
                  Codenames oyununun en heyecanlı ve tehlikeli kartıdır. Masadaki 25 karttan tam olarak 1 tanesi Suikastçıdır.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-900 text-white space-y-3">
                <div className="flex items-center gap-2 font-black text-rose-400 text-sm">
                  <span>☠️ Ani Ölüm Kuralı (Sudden Death)</span>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Eğer Kırmızı Takım veya Mavi Takım yanlışlıkla Suikastçı kartını açarsa, oyun <strong>O ANDA BİTER</strong> ve açmayan rakip takım doğrudan <strong>ŞAMPİYON İLAN EDİLİR!</strong>
                </p>
                <div className="p-3 bg-stone-800/80 rounded-xl border border-stone-700 text-xs text-stone-200">
                  👑 <strong>Liderler İçin Hayati Taktik:</strong> İpucu verirken Suikastçı kartındaki kelimeyle uzaktan yakından benzerlik gösterebilecek hiçbir kelimeyi KULLANMAYIN!
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">
            {activeTab === 'basics' && '1 / 5 • Temel Amaç'}
            {activeTab === 'spymaster' && '2 / 5 • Lider Kuralları'}
            {activeTab === 'operatives' && '3 / 5 • Saha Ajanları'}
            {activeTab === 'tv_mode' && '4 / 5 • TV & Telefon Modu'}
            {activeTab === 'assassin' && '5 / 5 • Suikastçı'}
          </span>

          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span>Harika, Oyuna Başla!</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
