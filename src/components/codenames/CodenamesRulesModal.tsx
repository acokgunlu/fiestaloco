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

import { t } from '../../i18n';
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
        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-500 to-sky-600 text-white flex items-center justify-center text-xl font-black shadow-md">
              🕵️‍♂️
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {t('Gizli Ajanlar (Codenames) Oyun Rehberi')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {t('Takım Stratejisi • İpucu Verme • TV Host & Telefon Kumandası')}</p>
            </div>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl gap-1 mt-4 overflow-x-auto text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0">
          <button
            onClick={() => {
              playClickSound();
              setActiveTab('basics');
            }}
            className={`py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'basics' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-black' : 'hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{t('1. Temel Amaç')}</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              setActiveTab('spymaster');
            }}
            className={`py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'spymaster' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-black' : 'hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('2. Lider (Spymaster)')}</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              setActiveTab('operatives');
            }}
            className={`py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'operatives' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-black' : 'hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{t('3. Saha Ajanları')}</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              setActiveTab('tv_mode');
            }}
            className={`py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'tv_mode' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-black' : 'hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Tv className="w-3.5 h-3.5 text-rose-500" />
            <span>{t('4. TV & Telefon Modu')}</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              setActiveTab('assassin');
            }}
            className={`py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'assassin' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-black' : 'hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Skull className="w-3.5 h-3.5 text-stone-700" />
            <span>{t('5. Suikastçı Tuzağı')}</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto py-4 space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 pr-1 grow">
          {/* TAB 1: BASICS */}
          {activeTab === 'basics' && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-red-50 to-blue-50 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 font-black text-slate-900 dark:text-slate-100 text-sm">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>{t('Oyunun Temel Amacı')}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  İki rakip takım (<strong>{t('🔴 Kırmızı Takım')}</strong> ve <strong>{t('🔵 Mavi Takım')}</strong>) 5x5 boyutundaki 25 kelimelik masada gizli ajanlarını arar. Masadaki tüm kendi ajanlarını düşmandan önce açığa çıkaran takım oyunu kazanır!
                </p>
              </div>

              {/* Card Distribution Matrix */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <h4 className="font-black text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                  {t('5x5 Masadaki 25 Kartın Gizli Dağılımı:')}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-900 text-red-950">
                    <div className="text-xl">🔴</div>
                    <div className="font-black text-red-800 dark:text-red-300 text-sm mt-1">{t('8 veya 9 Ajan')}</div>
                    <div className="text-[11px] text-red-700 dark:text-red-300 font-bold">{t('Kırmızı Takım')}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-sky-100 dark:bg-sky-900/40 border border-sky-200 dark:border-sky-900 text-sky-950">
                    <div className="text-xl">🔵</div>
                    <div className="font-black text-sky-800 dark:text-sky-300 text-sm mt-1">{t('8 veya 9 Ajan')}</div>
                    <div className="text-[11px] text-sky-700 dark:text-sky-300 font-bold">{t('Mavi Takım')}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-950">
                    <div className="text-xl">⚪</div>
                    <div className="font-black text-amber-800 dark:text-amber-300 text-sm mt-1">{t('7 Sivil')}</div>
                    <div className="text-[11px] text-amber-700 dark:text-amber-300 font-bold">{t('Masum Seyirci')}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 text-white">
                    <div className="text-xl">☠️</div>
                    <div className="font-black text-rose-400 text-sm mt-1">{t('1 Suikastçı')}</div>
                    <div className="text-[11px] text-stone-300 font-bold">{t('Anında Kaybettirir!')}</div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-2xl text-indigo-900 dark:text-indigo-200 space-y-1">
                <div className="font-black flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{t('Başlangıç Avantajı (9 Ajan)')}</span>
                </div>
                <p className="text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed">
                  {t('İlk başlayan takımın bulması gereken 9 ajanı vardır; ikinci başlayan takımın ise 8 ajanı bulunur.')}</p>
              </div>
            </div>
          )}

          {/* TAB 2: SPYMASTER */}
          {activeTab === 'spymaster' && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 dark:border-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-black text-amber-950 text-sm">
                  <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>{t('Ajan Lideri (Spymaster) Nasıl Oynar?')}</span>
                </div>
                <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                  {t('Ajan lideri tüm kartların gizli kimliklerini (Kırmızı, Mavi, Sivil, Suikastçı) görür. Görevi, kendi ajanlarına masadaki kartları bağdaştıran tek kelimelik bir ipucu ve sayı vermektir.')}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                  {t('Altın İpucu Kuralları:')}</h4>
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 dark:text-slate-100">{t('Format: TEK KELİME + SAYI')}</strong>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                        Örnek: <em>{t('"HAYVAN, 3"')}</em> (Masadaki ASLAN, KARTAL, KURT kelimelerini bağlamak için).
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 dark:text-slate-100">{t('YASAK: Masadaki Kelimelerin Kökünü Kullanmak')}</strong>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                        Eğer masada <em>{t('"GÖZLÜK"')}</em> varsa <em>{t('"GÖZ"')}</em> ipucu verilemez. Aynı şekilde eşsesli/harf benzerliği hilesi yapılamaz.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 dark:text-slate-100">{t('Gizli Mimik ve İpucu Vermek Yasaktır')}</strong>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                        {t('Lider sadece ipucu kelimesini ve sayıyı söyler. Göz kırpma, parmakla işaret etme veya tepki verme kural dışıdır.')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: OPERATIVES */}
          {activeTab === 'operatives' && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 space-y-2">
                <div className="flex items-center gap-2 font-black text-sky-950 text-sm">
                  <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>{t('Saha Ajanları (Operatives) Nasıl Oynar?')}</span>
                </div>
                <p className="text-xs text-sky-900 dark:text-sky-200 leading-relaxed">
                  {t('Saha ajanları masadaki kelimeleri görür ancak renkleri bilmez. Liderin ipucunu aralarında tartışarak en mantıklı kartı seçip açarlar.')}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                  {t('Kart Açıldığında Ne Olur?')}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl">
                    <span className="font-black text-emerald-900 dark:text-emerald-200">{t('✅ Kendi Renginiz Çıkarsa:')}</span>
                    <p className="text-emerald-800 dark:text-emerald-300 mt-1">
                      {t('Puan kazanırsınız ve kalan tahmin hakkınız kadar yeni bir kart açmaya devam edebilirsiniz.')}</p>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl">
                    <span className="font-black text-amber-900 dark:text-amber-200">{t('⚪ Masum Sivil Çıkarsa:')}</span>
                    <p className="text-amber-800 dark:text-amber-300 mt-1">
                      {t('Turunuz anında sona erer. Sıra karşı takıma geçer.')}</p>
                  </div>
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl">
                    <span className="font-black text-rose-900 dark:text-rose-200">{t('🔴/🔵 Karşı Takım Çıkarsa:')}</span>
                    <p className="text-rose-800 dark:text-rose-300 mt-1">
                      {t('Karşı takıma bedava 1 ajan kazandırmış olursunuz ve turunuz anında biter!')}</p>
                  </div>
                  <div className="p-3 bg-stone-900 border border-stone-800 rounded-xl text-white">
                    <span className="font-black text-rose-400">{t('☠️ Kara Suikastçı Çıkarsa:')}</span>
                    <p className="text-stone-300 mt-1">
                      {t('Oyun anında biter ve takımınız direkt kaybeder!')}</p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300">
                💡 <strong>{t('Tahmin Sayısı Bonusu:')}</strong> Lider <em>"3"</em> dediyse, takımınız en fazla <strong>3 + 1 = 4</strong> tahmin yapabilir. İstediğiniz an <em>{t('"Turu Bitir"')}</em> diyerek sırayı devredebilirsiniz.
              </div>
            </div>
          )}

          {/* TAB 4: TV & TELEFON MODU */}
          {activeTab === 'tv_mode' && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 dark:border-indigo-900 space-y-2">
                <div className="flex items-center gap-2 font-black text-indigo-950 text-sm">
                  <Tv className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>{t('TV Ekranı & Akıllı Telefon Kumandası Modu')}</span>
                </div>
                <p className="text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
                  {t('Oyununuzu TV veya büyük ekrana yansıtıp oturma odanızda gerçek bir oyun gecesi düzenleyin!')}</p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center text-xs shrink-0">
                    1
                  </div>
                  <div>
                    <h5 className="font-black text-slate-900 dark:text-slate-100 text-xs">{t('TV\'de "Oda Aç (TV / Host)" Seçeneğini Seçin')}</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      {t('Büyük ekranda 25 kartlık ahşap masa panosu ve 4 haneli oda kodu belirir.')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <div className="w-7 h-7 rounded-full bg-rose-600 text-white font-black flex items-center justify-center text-xs shrink-0">
                    2
                  </div>
                  <div>
                    <h5 className="font-black text-slate-900 dark:text-slate-100 text-xs">{t('Oyuncular Telefonlarından Katılır')}</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      {t('Telefon tarayıcısından oda kodunu girip Takımlarını (Kırmızı/Mavi) ve Rollerini (Lider veya Saha Ajanı) seçerler.')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-xs shrink-0">
                    3
                  </div>
                  <div>
                    <h5 className="font-black text-slate-900 dark:text-slate-100 text-xs">{t('Gizli Lider Haritası Telefon Ekranında Görünür')}</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      {t("Liderlerin telefonunda 5x5 renkli anahtar matrisi ve ipucu kutusu açılır. Saha ajanları ise kelimeleri görüp TV'deki kartları canlı olarak çevirebilir!")}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ASSASSIN */}
          {activeTab === 'assassin' && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-2">
                <div className="flex items-center gap-2 font-black text-rose-950 text-sm">
                  <Skull className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>{t('Kara Suikastçı (The Assassin) Hakkında')}</span>
                </div>
                <p className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed">
                  {t('Codenames oyununun en heyecanlı ve tehlikeli kartıdır. Masadaki 25 karttan tam olarak 1 tanesi Suikastçıdır.')}</p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-900 text-white space-y-3">
                <div className="flex items-center gap-2 font-black text-rose-400 text-sm">
                  <span>{t('☠️ Ani Ölüm Kuralı (Sudden Death)')}</span>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Eğer Kırmızı Takım veya Mavi Takım yanlışlıkla Suikastçı kartını açarsa, oyun <strong>{t('O ANDA BİTER')}</strong> ve açmayan rakip takım doğrudan <strong>{t('ŞAMPİYON İLAN EDİLİR!')}</strong>
                </p>
                <div className="p-3 bg-stone-800/80 rounded-xl border border-stone-700 text-xs text-stone-200">
                  👑 <strong>{t('Liderler İçin Hayati Taktik:')}</strong>  {t('İpucu verirken Suikastçı kartındaki kelimeyle uzaktan yakından benzerlik gösterebilecek hiçbir kelimeyi KULLANMAYIN!')}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {activeTab === 'basics' && t('1 / 5 • Temel Amaç')}
            {activeTab === 'spymaster' && t('2 / 5 • Lider Kuralları')}
            {activeTab === 'operatives' && t('3 / 5 • Saha Ajanları')}
            {activeTab === 'tv_mode' && '4 / 5 • TV & Telefon Modu'}
            {activeTab === 'assassin' && t('5 / 5 • Suikastçı')}
          </span>

          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span>{t('Harika, Oyuna Başla!')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
