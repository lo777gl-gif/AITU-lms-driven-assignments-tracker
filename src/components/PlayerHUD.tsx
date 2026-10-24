import React, { useState } from 'react';
import { UserProfile, Quest } from '../types';
import { getRankTitle } from '../utils/levelMath';
import { Award, Zap, Flame, CheckCircle, Clock, Plus, Edit2, User } from 'lucide-react';

interface PlayerHUDProps {
  profile: UserProfile;
  quests: Quest[];
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onOpenNewQuestModal: () => void;
}

export const PlayerHUD: React.FC<PlayerHUDProps> = ({
  profile,
  quests,
  onUpdateProfile,
  onOpenNewQuestModal,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(profile.name);

  const rank = getRankTitle(profile.level);
  const expPercent = Math.min(100, Math.round((profile.exp / profile.maxExp) * 100));

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
          {/* Solid Avatar */}
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
                className="absolute -bottom-2 -right-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold text-white bg-slate-900 border border-slate-700 shadow"
              >
                LV.{profile.level}
              </div>
            </div>
          </div>

          {/* Name & Level info */}
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
                    title="Изменить имя"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-muted)] mt-0.5 font-medium">
              <span className="font-semibold text-[var(--accent-primary)]">{rank.title}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">Ранг {rank.tier}</span>
              <span aria-hidden="true">·</span>
              <span>Студент</span>
            </div>

            {/* EXP Progress bar (solid color) */}
            <div className="mt-3 w-full max-w-md">
              <div className="flex justify-between items-center text-xs mb-1 font-mono">
                <span className="text-[var(--text-muted)] flex items-center gap-1">
                  <Zap className="w-3 h-3 text-[var(--accent-primary)]" />
                  <span>Опыт</span>
                </span>
                <span className="font-bold text-[var(--text-main)]">
                  {profile.exp} / {profile.maxExp} XP <span className="text-[var(--accent-primary)] font-semibold">({expPercent}%)</span>
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden p-0.5 border"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.08)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${expPercent}%`,
                    backgroundColor: 'var(--accent-primary)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Stats & New Quest Button */}
        <div
          className="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-6 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-4 lg:pt-0"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          {/* Metrics */}
          <div className="grid grid-cols-4 gap-3 sm:gap-5 text-center">
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

            <div>
              <div className="text-xs text-[var(--text-muted)] flex items-center justify-center gap-1">
                <Award className="w-3 h-3 text-[var(--accent-primary)]" />
                <span>Всего XP</span>
              </div>
              <div className="text-base sm:text-lg font-bold font-mono text-[var(--text-main)] mt-0.5">
                {profile.totalExpEarned}
              </div>
            </div>
          </div>

          {/* New Quest Button */}
          <button
            onClick={onOpenNewQuestModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-sm transition-all active:scale-95 shrink-0"
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
  );
};
