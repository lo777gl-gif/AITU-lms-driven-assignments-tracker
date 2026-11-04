import React, { useState } from 'react';
import { AlertTriangle, Moon, Dumbbell, Footprints, GraduationCap, MinusCircle, X, ShieldAlert } from 'lucide-react';

interface PenaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPoints: number;
  onApplyPenalty: (points: number, reason: string) => void;
}

export const PenaltyModal: React.FC<PenaltyModalProps> = ({
  isOpen,
  onClose,
  currentPoints,
  onApplyPenalty,
}) => {
  const [customReason, setCustomReason] = useState('');
  const [customPoints, setCustomPoints] = useState(10);

  if (!isOpen) return null;

  const handleApplyPreset = (points: number, reason: string) => {
    onApplyPenalty(points, reason);
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customReason.trim()) return;
    onApplyPenalty(Math.max(1, customPoints), customReason.trim());
    setCustomReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-xl rounded-2xl border p-6 shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'rgba(239, 68, 68, 0.4)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/15 border border-red-500/30 text-red-500 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
                <span>Система штрафов</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                  Дисциплина
                </span>
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Фиксация нарушений режима и списания баллов
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Balance Notice */}
        <div
          className="my-4 p-3 rounded-xl border flex items-center justify-between text-xs font-mono"
          style={{
            backgroundColor: 'var(--bg-surface-hover)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <span className="text-[var(--text-muted)]">Текущий баланс студента:</span>
          <span className="font-bold text-amber-500 text-sm">{currentPoints} б.</span>
        </div>

        {/* Official Penalties List */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Официальные штрафы
          </h4>

          {/* Rule 1: Сон после 23:00 */}
          <div
            className="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:border-red-500/40"
            style={{
              backgroundColor: 'var(--bg-surface-hover)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--text-main)]">Сон после 23:00</span>
                  <span className="text-xs font-mono font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                    -10 б.
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug">
                  Сбой режима обходится дорого, так как напрямую бьет по энергии для утренних тренировок.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleApplyPreset(10, 'Сон после 23:00 (сбой режима)')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-all active:scale-95 shrink-0 flex items-center justify-center gap-1"
            >
              <MinusCircle className="w-3.5 h-3.5" />
              <span>Штраф -10 б.</span>
            </button>
          </div>

          {/* Rule 2: Пропуск утренней тренировки */}
          <div
            className="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:border-red-500/40"
            style={{
              backgroundColor: 'var(--bg-surface-hover)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                <Dumbbell className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--text-main)]">Пропуск утренней тренировки</span>
                  <span className="text-xs font-mono font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                    -5 б.
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug">
                  Пропуск зарядки, ОФП или разминки перед началом учебного дня.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleApplyPreset(5, 'Пропуск утренней тренировки')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-all active:scale-95 shrink-0 flex items-center justify-center gap-1"
            >
              <MinusCircle className="w-3.5 h-3.5" />
              <span>Штраф -5 б.</span>
            </button>
          </div>

          {/* Rule 3: Пропуск бега */}
          <div
            className="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:border-red-500/40"
            style={{
              backgroundColor: 'var(--bg-surface-hover)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                <Footprints className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--text-main)]">Пропуск бега</span>
                  <span className="text-xs font-mono font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                    -5 б.
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug">
                  Пропуск кардио-пробежки на свежем воздухе в запланированный день.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleApplyPreset(5, 'Пропуск бега')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-all active:scale-95 shrink-0 flex items-center justify-center gap-1"
            >
              <MinusCircle className="w-3.5 h-3.5" />
              <span>Штраф -5 б.</span>
            </button>
          </div>

          {/* Rule 4: Срыв дедлайна по университетскому заданию */}
          <div
            className="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:border-red-500/40"
            style={{
              backgroundColor: 'var(--bg-surface-hover)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--text-main)]">Срыв дедлайна по заданию из университета</span>
                  <span className="text-xs font-mono font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                    -20 б.
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug">
                  Учеба приносит больше всего баллов, поэтому цена прокрастинации здесь самая высокая.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleApplyPreset(20, 'Срыв дедлайна по заданию из университета')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-all active:scale-95 shrink-0 flex items-center justify-center gap-1"
            >
              <MinusCircle className="w-3.5 h-3.5" />
              <span>Штраф -20 б.</span>
            </button>
          </div>
        </div>

        {/* Custom Penalty Form */}
        <form onSubmit={handleApplyCustom} className="mt-5 pt-4 border-t space-y-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
          <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Произвольный штраф
          </h4>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              placeholder="Причина штрафа (например: опоздание, отвлечение на соцсети...)"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="w-full sm:flex-1 px-3 py-2 text-xs rounded-xl border bg-transparent text-[var(--text-main)] focus:outline-none"
              style={{ borderColor: 'var(--border-subtle)' }}
            />

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="number"
                min={1}
                max={100}
                value={customPoints}
                onChange={(e) => setCustomPoints(Number(e.target.value))}
                className="w-20 px-2.5 py-2 text-xs font-mono font-bold rounded-xl border bg-transparent text-[var(--text-main)] focus:outline-none"
                style={{ borderColor: 'var(--border-subtle)' }}
              />

              <button
                type="submit"
                disabled={!customReason.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-all shrink-0 whitespace-nowrap"
              >
                Оштрафовать
              </button>
            </div>
          </div>
        </form>

        {/* Close Button */}
        <div className="pt-4 border-t mt-4 flex justify-end" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] border"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
