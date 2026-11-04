import React, { useState } from 'react';
import { UserProfile, Quest } from '../types';
import {
  Coins,
  Flame,
  CheckCircle,
  Clock,
  Plus,
  Edit2,
  User,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';

interface PlayerHUDProps {
  profile: UserProfile;
  quests: Quest[];
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onOpenNewQuestModal: () => void;
  onOpenSpendModal: () => void;
  onOpenAccountModal: () => void;
  onOpenResetModal: () => void;
  onOpenPenaltyModal: () => void;
}

export const PlayerHUD: React.FC<PlayerHUDProps> = ({
  profile,
  quests,
  onUpdateProfile,
  onOpenNewQuestModal,
  onOpenSpendModal,
  onOpenAccountModal,
  onOpenResetModal,
  onOpenPenaltyModal,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(profile.name);

  const now = Date.now();
  const activeCount = quests.filter((q) => !q.isCompleted && q.deadlineTimestamp >= now).length;
  const burningCount = quests.filter(
    (q) => !q.isCompleted && q.deadlineTimestamp >= now && q.deadlineTimestamp - now < 48 * 3600 * 1000
  ).length;
  const completedCount = quests.filter((q) => q.isCompleted).length;

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      onUpdateProfile({ name: tempName.trim() });
    }
    setIsEditingName(false);
  };

  return (
    <div
      className="rounded-2xl border p-5 sm:p-6 mb-8 transition-all"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Left: Avatar & Profile Details */}
        <div className="flex items-center gap-4 sm:gap-5 w-full lg:w-auto">
          {/* Avatar with Points Badge */}
          <div className="relative shrink-0">
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center border text-white font-bold text-2xl relative shadow-sm"
              style={{
                backgroundColor: 'var(--accent-primary)',
                borderColor: 'var(--border-strong)',
              }}
            >
              <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              <div
                className="absolute -bottom-2 -right-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold text-amber-300 bg-slate-900 border border-amber-500/40 shadow flex items-center gap-0.5"
              >
                <Coins className="w-2.5 h-2.5" />
                <span>{profile.points}</span>
              </div>
            </div>
          </div>

          {/* Name & Points Balance */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <form onSubmit={handleSaveName} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    autoFocus
                    className="px-2 py-1 text-sm rounded-lg border bg-transparent font-bold text-[var(--text-main)]"
                    style={{ borderColor: 'var(--accent-primary)' }}
                  />
                  <button
                    type="submit"
                    className="text-xs px-2.5 py-1 rounded-lg text-white font-semibold"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  >
                    OK
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-main)] truncate">
                    {profile.name}
                  </h1>
                  <button
                    onClick={() => {
                      setTempName(profile.name);
                      setIsEditingName(true);
                    }}
                    className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 transition-colors"
                    title="Изменить отображаемое имя"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={onOpenAccountModal}
                    title="Сменить аккаунт или зарегистрировать новый"
                    className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-lg border text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white transition-all ml-1"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    Сменить аккаунт
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-muted)] mt-0.5 font-medium">
              <span className="font-semibold text-[var(--accent-primary)]">Академический трекер</span>
              <span aria-hidden="true">·</span>
              <span>Балловая система</span>
              <span aria-hidden="true">·</span>
              <span>Астана (UTC+5)</span>
            </div>

            {/* Points Summary Bar */}
            <div className="mt-3 flex flex-wrap items-center gap-2.5 sm:gap-4">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border"
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  borderColor: 'rgba(245, 158, 11, 0.3)',
                }}
              >
                <Coins className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-[var(--text-muted)]">Доступно:</span>
                <span className="font-mono font-bold text-sm text-amber-500">
                  {profile.points} <span className="text-xs font-normal">баллов</span>
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono text-[var(--text-muted)]">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400" title="Всего набрано за время учебы">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>+{profile.totalPointsEarned}</span>
                </span>
                <span className="flex items-center gap-1 text-slate-500" title="Всего списано на вознаграждения">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>-{profile.totalPointsSpent}</span>
                </span>
                {(profile.totalPenalties || 0) > 0 && (
                  <span className="flex items-center gap-1 text-red-500 font-bold" title="Списано штрафами за нарушения">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>-{profile.totalPenalties}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Stats & Action Buttons */}
        <div
          className="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-6 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-4 lg:pt-0"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3 sm:gap-5 text-center">
            <div>
              <div className="text-xs text-[var(--text-muted)] flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" />
                <span>В работе</span>
              </div>
              <div className="text-base sm:text-lg font-bold font-mono text-[var(--text-main)] mt-0.5">
                {activeCount}
              </div>
            </div>

            <div>
              <div className="text-xs text-amber-500 flex items-center justify-center gap-1">
                <Flame className="w-3 h-3" />
                <span>Горят</span>
              </div>
              <div className="text-base sm:text-lg font-bold font-mono text-amber-500 mt-0.5">
                {burningCount}
              </div>
            </div>

            <div>
              <div className="text-xs text-emerald-500 flex items-center justify-center gap-1">
                <CheckCircle className="w-3 h-3" />
                <span>Сдано</span>
              </div>
              <div className="text-base sm:text-lg font-bold font-mono text-emerald-500 mt-0.5">
                {completedCount}
              </div>
            </div>
          </div>

          {/* Action Buttons: Penalty, Reset, Spend, New Quest */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Penalty trigger */}
            <button
              onClick={onOpenPenaltyModal}
              title="Выписать штраф (сон после 23:00, пропуск тренировки/бега, срыв дедлайна)"
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all active:scale-95 text-red-500 border-red-500/40 hover:bg-red-500/10 cursor-pointer"
              style={{ backgroundColor: 'var(--bg-surface)' }}
            >
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span>Штрафы</span>
            </button>

            {/* Spend Points */}
            <button
              onClick={onOpenSpendModal}
              title="Списать накопленные баллы на награды и отдых"
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all active:scale-95 text-amber-600 dark:text-amber-400 border-amber-500/40 hover:bg-amber-500/10 cursor-pointer"
              style={{ backgroundColor: 'var(--bg-surface)' }}
            >
              <ShoppingBag className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">Списать баллы</span>
              <span className="sm:hidden">Списать</span>
            </button>

            {/* Reset Progress */}
            <button
              onClick={onOpenResetModal}
              title="Обнулить все накопленные баллы и прогресс навыков (с подтверждением)"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all active:scale-95 text-[var(--text-muted)] hover:text-red-500 hover:border-red-500/40 cursor-pointer"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden md:inline">Сбросить</span>
            </button>

            {/* New Quest */}
            <button
              onClick={onOpenNewQuestModal}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-sm transition-all active:scale-95 cursor-pointer"
              style={{
                backgroundColor: 'var(--accent-primary)',
              }}
            >
              <Plus className="w-4 h-4" />
              <span>Новый квест</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
