import React, { useState } from 'react';
import { Quest, Skill, QuestStatus } from '../types';
import { getRemainingTimeText, getQuestStatus, formatToAstanaTime } from '../utils/icsParser';
import { QUEST_RANKS, getRecurrenceDescription, getQuestPenaltyPoints } from '../utils/levelMath';
import {
  Flame,
  CheckCircle2,
  Clock,
  Trash2,
  Edit3,
  Repeat,
  Circle,
  Coins,
  AlertTriangle,
} from 'lucide-react';

interface QuestCardProps {
  quest: Quest;
  skills: Skill[];
  onCompleteQuest: (questId: string) => void;
  onUncompleteQuest: (questId: string) => void;
  onDeleteQuest: (questId: string) => void;
  onOpenEditModal: (quest: Quest) => void;
  onApplyPenalty?: (quest: Quest) => void;
}

export const QuestCard: React.FC<QuestCardProps> = ({
  quest,
  skills,
  onCompleteQuest,
  onUncompleteQuest,
  onDeleteQuest,
  onOpenEditModal,
  onApplyPenalty,
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const status: QuestStatus = getQuestStatus(quest);
  const remaining = getRemainingTimeText(quest.deadlineTimestamp, quest.isCompleted);
  const currentRankInfo = QUEST_RANKS[quest.difficulty] || QUEST_RANKS['A'];
  const questPoints = quest.points || currentRankInfo.points;
  const recurrenceText = getRecurrenceDescription(quest);

  // Border color based on status
  const getBorderColor = () => {
    if (quest.isCompleted) return 'var(--border-subtle)';
    if (status === 'burning') return '#f59e0b';
    if (status === 'failed') return '#ef4444';
    return 'var(--border-subtle)';
  };

  const handleToggleComplete = () => {
    if (quest.isCompleted) {
      onUncompleteQuest(quest.id);
    } else {
      onCompleteQuest(quest.id);
    }
  };

  return (
    <div
      className={`rounded-xl border transition-all ${
        quest.isCompleted ? 'opacity-65' : ''
      } ${status === 'burning' && !quest.isCompleted ? 'burning-glow' : ''}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: getBorderColor(),
      }}
    >
      <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Checkbox Toggle */}
        <button
          onClick={handleToggleComplete}
          title={quest.isCompleted ? 'Снять отметку о выполнении' : 'Отметить как выполненное'}
          className="shrink-0 p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-transform active:scale-90 focus:outline-none"
        >
          {quest.isCompleted ? (
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 fill-emerald-500/20" />
          ) : (
            <Circle className="w-5 h-5 sm:w-6 sm:h-6 hover:text-emerald-500 hover:scale-105 transition-all text-[var(--text-muted)]" />
          )}
        </button>

        {/* Center: Minimalist Task Information */}
        <div className="flex-1 min-w-0">
          {/* Top badges: Rank, Course/Category, Recurrence */}
          <div className="flex flex-wrap items-center gap-1.5 mb-1 text-xs">
            {/* Difficulty Rank Pill */}
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold leading-none"
              style={{
                backgroundColor: currentRankInfo.badgeBg,
                color: currentRankInfo.badgeText,
              }}
            >
              {quest.difficulty}
            </span>

            {/* Course or Category */}
            <span className="font-medium text-[var(--accent-primary)] truncate max-w-[170px] sm:max-w-[240px]">
              {quest.courseName || 'Общее'}
            </span>

            {/* Recurrence Cadence Badge */}
            {quest.isRecurring && recurrenceText && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border font-medium text-purple-600 dark:text-purple-400 border-purple-500/30 bg-purple-500/10">
                <Repeat className="w-2.5 h-2.5" />
                <span>{recurrenceText}</span>
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            className={`font-bold text-sm sm:text-base leading-snug truncate text-[var(--text-main)] ${
              quest.isCompleted ? 'line-through text-[var(--text-muted)]' : ''
            }`}
          >
            {quest.cleanTitle || quest.summary}
          </h3>

          {/* Bottom row: Deadline info & Completed count */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)] font-mono mt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-[var(--text-muted)]" />
              <span>{quest.localDeadline}</span>
            </span>

            {!quest.isCompleted && (
              <>
                <span aria-hidden="true">·</span>
                <span
                  className={`flex items-center gap-1 font-semibold ${
                    remaining.isBurning ? 'text-amber-500' : remaining.isExpired ? 'text-red-500' : 'text-[var(--text-muted)]'
                  }`}
                >
                  {remaining.isBurning && <Flame className="w-3 h-3 text-amber-500" />}
                  <span>{remaining.text}</span>
                </span>
              </>
            )}

            {quest.isRecurring && (quest.completedCount || 0) > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-500">Сдано: {quest.completedCount} раз</span>
              </>
            )}

            {quest.isRecurring && quest.isCompleted && quest.nextScheduledDate && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-purple-600 dark:text-purple-400 font-medium">
                  Следующий цикл: {formatToAstanaTime(quest.nextScheduledDate)}
                </span>
              </>
            )}

            {remaining.isExpired && !quest.isCompleted && (
              <>
                <span aria-hidden="true">·</span>
                {quest.isPenalized ? (
                  <span className="text-[10px] font-mono font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                    Штраф начислен (-{getQuestPenaltyPoints(quest)} б.)
                  </span>
                ) : (
                  <button
                    onClick={() => onApplyPenalty?.(quest)}
                    className="text-[10px] font-mono font-bold text-red-500 hover:bg-red-500/15 border border-red-500/40 px-2 py-0.5 rounded transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                    title="Применить штраф за срыв дедлайна"
                  >
                    <AlertTriangle className="w-2.5 h-2.5" />
                    <span>Штраф -{getQuestPenaltyPoints(quest)} б.</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right: Points Badge & Clean Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Points Badge */}
          <div
            className="px-2.5 py-1 rounded-lg border font-mono font-bold text-xs shrink-0 flex items-center gap-1"
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              borderColor: 'rgba(245, 158, 11, 0.3)',
              color: '#d97706',
            }}
          >
            <Coins className="w-3 h-3" />
            <span>+{questPoints} б.</span>
          </div>

          {/* Edit Button */}
          <button
            onClick={() => onOpenEditModal(quest)}
            title="Редактировать задание"
            className="p-1.5 rounded-lg border text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--accent-primary)] transition-colors"
            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          {/* Delete Button */}
          {showConfirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onDeleteQuest(quest.id)}
                className="px-2 py-1 rounded-lg text-[10px] font-bold text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Да
              </button>
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-1.5 py-1 rounded-lg text-[10px] text-[var(--text-muted)] border hover:text-[var(--text-main)]"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmDelete(true)}
              title="Удалить задание"
              className="p-1.5 rounded-lg border text-[var(--text-muted)] hover:text-red-400 hover:border-red-400 transition-colors"
              style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
