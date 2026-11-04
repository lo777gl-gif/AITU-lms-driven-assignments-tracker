import React, { useState } from 'react';
import { SPEND_REWARDS } from '../utils/levelMath';
import { MinusCircle, X, Sparkles, Check, AlertCircle, ShoppingBag } from 'lucide-react';

interface SpendPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPoints: number;
  onSpendPoints: (amount: number, reason: string) => boolean;
}

export const SpendPointsModal: React.FC<SpendPointsModalProps> = ({
  isOpen,
  onClose,
  currentPoints,
  onSpendPoints,
}) => {
  const [customAmount, setCustomAmount] = useState<number>(50);
  const [customReason, setCustomReason] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSpendPreset = (cost: number, title: string) => {
    if (currentPoints < cost) {
      setErrorMessage(`Недостаточно баллов. Требуется ${cost}, доступно ${currentPoints}.`);
      return;
    }
    const success = onSpendPoints(cost, title);
    if (success) {
      onClose();
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customAmount <= 0) {
      setErrorMessage('Количество баллов для списания должно быть больше нуля.');
      return;
    }
    if (currentPoints < customAmount) {
      setErrorMessage(`Недостаточно баллов! Доступно: ${currentPoints}.`);
      return;
    }

    const reason = customReason.trim() || 'Пользовательское вознаграждение';
    const success = onSpendPoints(customAmount, reason);
    if (success) {
      setCustomReason('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div
        className="w-full max-w-lg rounded-2xl border p-6 shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-strong)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between pb-4 border-b"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-sm"
              style={{
                backgroundColor: '#dc2626',
              }}
            >
              <MinusCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-main)]">
                Списание баллов / Награды себе
              </h3>
              <div className="text-xs text-[var(--text-muted)] font-mono">
                Доступный баланс:{' '}
                <span className="font-bold text-[var(--accent-primary)] text-sm">
                  {currentPoints} баллов
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Preset Rewards */}
        <div className="mt-4 space-y-2">
          <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Быстрые награды за учебу
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SPEND_REWARDS.map((reward) => {
              const canAfford = currentPoints >= reward.cost;
              return (
                <button
                  key={reward.id}
                  onClick={() => handleSpendPreset(reward.cost, reward.title)}
                  disabled={!canAfford}
                  className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                    canAfford
                      ? 'hover:border-[var(--accent-primary)] hover:bg-[var(--bg-surface-hover)] cursor-pointer active:scale-[0.98]'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  style={{
                    backgroundColor: 'var(--bg-surface-hover)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <span className="text-2xl shrink-0">{reward.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-[var(--text-main)] truncate">
                      {reward.title}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] line-clamp-1 mt-0.5">
                      {reward.description}
                    </div>
                    <div className="text-[11px] font-mono font-bold text-red-400 mt-1">
                      -{reward.cost} баллов
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Spend Form */}
        <form onSubmit={handleCustomSubmit} className="mt-5 pt-4 border-t space-y-3"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="text-xs font-semibold text-[var(--text-main)]">
            Или укажите свою сумму и цель списания:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-[var(--text-muted)] mb-1">
                Баллы для списания
              </label>
              <input
                type="number"
                min={1}
                max={currentPoints > 0 ? currentPoints : 1}
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(Number(e.target.value));
                  setErrorMessage(null);
                }}
                className="w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border bg-transparent text-[var(--text-main)] focus:outline-none"
                style={{ borderColor: 'var(--border-subtle)' }}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] text-[var(--text-muted)] mb-1">
                На что списываете (причина/награда)
              </label>
              <input
                type="text"
                placeholder="например: Вкусный десерт, выходной от программирования..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border bg-transparent text-[var(--text-main)] focus:outline-none"
                style={{ borderColor: 'var(--border-subtle)' }}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] border"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={currentPoints < customAmount || customAmount <= 0}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: '#dc2626' }}
            >
              Списать {customAmount} баллов
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
