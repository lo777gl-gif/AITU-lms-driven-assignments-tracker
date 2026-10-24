import React from 'react';
import { Quest, Skill } from '../types';
import { QUEST_RANKS } from '../utils/levelMath';
import { Calendar, Clock, Flame, CheckCircle2, ChevronRight } from 'lucide-react';

interface TimelineViewProps {
  quests: Quest[];
  skills: Skill[];
  onSelectQuest: (questId: string) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ quests, skills, onSelectQuest }) => {
  const now = Date.now();

  const urgentQuests = quests.filter((q) => !q.isCompleted && q.deadlineTimestamp >= now && q.deadlineTimestamp - now < 48 * 3600 * 1000);
  const weekQuests = quests.filter((q) => !q.isCompleted && q.deadlineTimestamp >= now + 48 * 3600 * 1000 && q.deadlineTimestamp - now < 7 * 24 * 3600 * 1000);
  const laterQuests = quests.filter((q) => !q.isCompleted && q.deadlineTimestamp >= now + 7 * 24 * 3600 * 1000);
  const pastQuests = quests.filter((q) => !q.isCompleted && q.deadlineTimestamp < now);
  const completedQuests = quests.filter((q) => q.isCompleted);

  const renderQuestItem = (quest: Quest, isUrgent = false) => {
    const skill = skills.find((s) => s.id === quest.linkedSkillId);
    const rankInfo = QUEST_RANKS[quest.difficulty] || QUEST_RANKS['C'];

    return (
      <div
        key={quest.id}
        onClick={() => onSelectQuest(quest.id)}
        className="p-3.5 sm:p-4 rounded-xl border flex items-center justify-between gap-3 hover:border-[var(--accent-primary)] cursor-pointer transition-all active:scale-[0.99]"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: isUrgent ? '#f59e0b' : 'var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Difficulty Rank Pill */}
          <div
            className="w-6 h-6 rounded-md font-mono text-xs font-bold shrink-0 flex items-center justify-center shadow-sm"
            style={{
              backgroundColor: rankInfo.badgeBg,
              color: rankInfo.badgeText,
            }}
          >
            {quest.difficulty}
          </div>

          <div className="min-w-0">
            <div className="text-xs font-semibold text-[var(--accent-primary)] truncate">
              {quest.courseName}
            </div>
            <div className="text-sm font-bold text-[var(--text-main)] truncate mt-0.5">
              {quest.cleanTitle}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] font-mono flex items-center gap-2 mt-1">
              <span>{quest.localDeadline}</span>
              {skill && (
                <>
                  <span aria-hidden="true">·</span>
                  <span style={{ color: skill.color }}>{skill.name}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono font-bold text-[var(--accent-primary)]">
            +{quest.baseExp} XP
          </span>
          <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)] flex items-center gap-2">
          <Calendar className="w-6 h-6 text-[var(--accent-primary)]" />
          <span>Таймлайн дедлайнов (Астана UTC+5)</span>
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
          Хронологический обзор всех академических контрольных точек, лабораторных и рубежек.
        </p>
      </div>

      {/* Urgent Quests (< 48 hours) */}
      {urgentQuests.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider flex items-center gap-2">
            <Flame className="w-4 h-4" />
            <span>Горящий рубеж (ближайшие 48 часов) — {urgentQuests.length}</span>
          </h3>
          <div className="space-y-2">
            {urgentQuests.map((q) => renderQuestItem(q, true))}
          </div>
        </div>
      )}

      {/* Coming this week */}
      {weekQuests.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--accent-primary)]" />
            <span>На этой неделе (3–7 дней) — {weekQuests.length}</span>
          </h3>
          <div className="space-y-2">
            {weekQuests.map((q) => renderQuestItem(q))}
          </div>
        </div>
      )}

      {/* Coming later */}
      {laterQuests.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Предстоящие недели семестра — {laterQuests.length}</span>
          </h3>
          <div className="space-y-2">
            {laterQuests.map((q) => renderQuestItem(q))}
          </div>
        </div>
      )}

      {/* Expired / Overdue */}
      {pastQuests.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider flex items-center gap-2">
            <span>Просроченные задания — {pastQuests.length}</span>
          </h3>
          <div className="space-y-2 opacity-80">
            {pastQuests.map((q) => renderQuestItem(q))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completedQuests.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Сданные квесты — {completedQuests.length}</span>
          </h3>
          <div className="space-y-2 opacity-70">
            {completedQuests.map((q) => renderQuestItem(q))}
          </div>
        </div>
      )}
    </div>
  );
};
