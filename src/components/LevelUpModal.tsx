import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { getRankTitle, AVAILABLE_PERKS } from '../utils/levelMath';
import { Award, Sparkles } from 'lucide-react';

interface LevelUpModalProps {
  level: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectPerk: (perkId: string) => void;
  unlockedPerks: string[];
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  level,
  isOpen,
  onClose,
  onSelectPerk,
  unlockedPerks,
}) => {
  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#2563eb', '#10b981', '#f59e0b', '#7c3aed'],
        });
      } catch {
        // Fallback
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const rank = getRankTitle(level);
  const eligiblePerks = AVAILABLE_PERKS.filter((p) => p.levelRequired <= level && !unlockedPerks.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-2xl border p-6 sm:p-8 text-center shadow-2xl animate-scaleIn relative overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-strong)',
        }}
      >
        <div className="relative">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3 shadow-sm border text-white animate-bounce"
            style={{
              backgroundColor: 'var(--accent-primary)',
              borderColor: 'var(--border-strong)',
            }}
          >
            <Award className="w-8 h-8 text-white" />
          </div>

          <div className="text-xs font-mono font-bold tracking-widest text-[var(--accent-primary)] uppercase">
            ПОВЫШЕНИЕ УРОВНЯ
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-main)] mt-1">
            LEVEL {level}!
          </h2>
          <div className="text-sm font-semibold text-[var(--accent-primary)] mt-1">
            Звание: {rank.title} (Ранг {rank.tier})
          </div>

          <p className="text-xs text-[var(--text-muted)] mt-2 max-w-xs mx-auto leading-relaxed">
            Поздравляем! Ваш уровень повышен за успешное выполнение академических задач.
          </p>

          {eligiblePerks.length > 0 && (
            <div className="mt-5 text-left space-y-2">
              <div className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Выберите перк студента:</span>
              </div>
              {eligiblePerks.slice(0, 2).map((perk) => (
                <button
                  key={perk.id}
                  onClick={() => {
                    onSelectPerk(perk.id);
                    onClose();
                  }}
                  className="w-full p-3 rounded-xl border text-left flex items-start gap-3 hover:border-[var(--accent-primary)] hover:bg-black/5 transition-all"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    backgroundColor: 'var(--bg-surface-hover)',
                  }}
                >
                  <span className="text-xl shrink-0">{perk.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-[var(--text-main)]">{perk.name}</div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{perk.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-sm transition-transform active:scale-95"
              style={{
                backgroundColor: 'var(--accent-primary)',
              }}
            >
              Продолжить учебу
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
