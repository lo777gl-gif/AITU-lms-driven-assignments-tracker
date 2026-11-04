import React from 'react';
import { AlertTriangle, RotateCcw, X, ShieldAlert } from 'lucide-react';

interface ResetProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPoints: number;
  onConfirmReset: () => void;
}

export const ResetProgressModal: React.FC<ResetProgressModalProps> = ({
  isOpen,
  onClose,
  currentPoints,
  onConfirmReset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-md rounded-2xl border p-6 shadow-2xl animate-scaleIn"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: '#ef4444',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/15 border border-red-500/30 text-red-500 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-main)]">
                Вы точно уверены?
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Подтверждение полного обнуления прогресса
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

        {/* Warning Content */}
        <div className="my-5 space-y-3">
          <div
            className="p-3.5 rounded-xl border text-xs space-y-2"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              borderColor: 'rgba(239, 68, 68, 0.25)',
              color: 'var(--text-main)',
            }}
          >
            <div className="font-bold text-red-500 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              <span>Это действие необратимо и обнулит:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[var(--text-muted)] text-[11px] leading-relaxed">
              <li>Текущий баланс: <b className="text-amber-500">{currentPoints} б.</b> → <b>0 б.</b></li>
              <li>Все заработанные и потраченные баллы</li>
              <li>Баллы прогресса во всех прокачиваемых навыках → <b>0 б.</b></li>
              <li>Счётчик выполненных квестов</li>
            </ul>
          </div>

          <p className="text-xs text-[var(--text-muted)] text-center">
            Сами списки заданий и расписание сохранятся, но весь игровой счёт начнется с чистого листа.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] border transition-colors"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            Отмена
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirmReset();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm transition-all active:scale-95 flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Да, обнулить весь прогресс</span>
          </button>
        </div>
      </div>
    </div>
  );
};
