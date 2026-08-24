import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Trophy, Users, Flame, HelpCircle, CheckCircle2 } from 'lucide-react';

import { t } from '../../i18n';
interface QuiplashRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuiplashRulesModal: React.FC<QuiplashRulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-900 dark:text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-amber-600/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white text-xl shadow-md shadow-pink-500/20">
                🥊
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">{t('Quiplash Nasıl Oynanır?')}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('Mizah, hazırcevaplık ve laf cambazlığı düellosu!')}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4 text-sm leading-relaxed">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-purple-900 dark:text-purple-300 font-bold mb-1">
                  {t('1. Yazma Aşaması (Prompt Writing)')}</strong>
                <p className="text-slate-600 dark:text-slate-300 text-xs">
                  {t('Her tur başında telefonunuza 2 absürt ve komik soru gelir. Amacınız doğru cevabı değil, masadaki herkesi en çok güldürecek en yaratıcı yanıtı yazmaktır!')}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <Flame className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-amber-900 dark:text-amber-300 font-bold mb-1">
                  {t('2. Birebir Düellolar (Head-to-Head Duels)')}</strong>
                <p className="text-slate-600 dark:text-slate-300 text-xs">
                  {t('Aynı soruya cevap veren iki oyuncunun yanıtları TV ekranında anonim olarak yan yana kapışır. O soruyu yazmayan tüm oyuncular telefonlarından en komik cevaba oy verir!')}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-pink-500/10 border border-pink-500/20">
              <Trophy className="w-5 h-5 text-pink-600 dark:text-pink-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-pink-900 dark:text-pink-300 font-bold mb-1">
                  {t('3. Puanlama & QUIPLASH! Bonusu')}</strong>
                <p className="text-slate-600 dark:text-slate-300 text-xs">
                  Her aldığınız oy size puan kazandırır (2. Turda 2 katı!). Eğer odadaki tüm oyları tek başınıza silip süpürürseniz <strong>{t('QUIPLASH!')}</strong> bonusu patlar!
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-emerald-900 dark:text-emerald-300 font-bold mb-1">
                  {t('4. The Last Lash (Büyük Final)')}</strong>
                <p className="text-slate-600 dark:text-slate-300 text-xs">
                  {t('Son turda tüm oyuncular tek bir ortak soruya cevap yazar. Ardından herkes en beğendiği yanıtlara 3 katı değerinde madalya oyları dağıtır ve Quiplash Şampiyonu belirlenir!')}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 shadow-md shadow-purple-500/20 transition-all flex items-center gap-2 text-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              {t('Anladım, Oyuna Başla')}</button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
