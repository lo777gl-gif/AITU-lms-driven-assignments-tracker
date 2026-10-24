import React, { useState } from 'react';
import { Quest, Skill, SubQuest, QuestStatus, QuestRank } from '../types';
import { getRemainingTimeText, getQuestStatus } from '../utils/icsParser';
import { QUEST_RANKS, RANK_LIST } from '../utils/levelMath';
import {
  Flame,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Zap,
  Layers,
  Sparkles,
} from 'lucide-react';

interface QuestCardProps {
  quest: Quest;
  skills: Skill[];
  onCompleteQuest: (questId: string) => void;
  onUncompleteQuest: (questId: string) => void;
  onToggleSubquest: (questId: string, subquestId: string) => void;
  onAddSubquest: (questId: string, text: string) => void;
  onDeleteSubquest: (questId: string, subquestId: string) => void;
  onChangeLinkedSkill: (questId: string, skillId: string) => void;
  onChangeDifficulty: (questId: string, rank: QuestRank) => void;
  onDeleteQuest: (questId: string) => void;
}

export const QuestCard: React.FC<QuestCardProps> = ({
  quest,
  skills,
  onCompleteQuest,
  onUncompleteQuest,
  onToggleSubquest,
  onAddSubquest,
  onDeleteSubquest,
  onChangeLinkedSkill,
  onChangeDifficulty,
  onDeleteQuest,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubquestText, setNewSubquestText] = useState('');
  const [isAddingSubquest, setIsAddingSubquest] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const status: QuestStatus = getQuestStatus(quest);
  const remaining = getRemainingTimeText(quest.deadlineTimestamp, quest.isCompleted);
  const currentRankInfo = QUEST_RANKS[quest.difficulty] || QUEST_RANKS['C'];

  const completedSubquests = quest.subquests.filter((s) => s.isCompleted).length;
  const totalSubquests = quest.subquests.length;

  const handleCreateSubquest = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubquestText.trim()) {
      onAddSubquest(quest.id, newSubquestText.trim());
      setNewSubquestText('');
      setIsAddingSubquest(false);
    }
  };

  const renderFormattedDescription = (text: string) => {
    if (!text) return <p className="italic text-xs text-[var(--text-muted)]">Описание отсутствует</p>;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return (
      <div className="whitespace-pre-wrap text-xs text-[var(--text-main)] leading-relaxed font-sans break-words">
        {parts.map((part, i) => {
          if (part.match(urlRegex)) {
            return (
              <a
                key={i}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-[var(--accent-primary)] hover:underline mx-1"
                onClick={(e) => e.stopPropagation()}
              >
                <span>{part}</span>
                <ExternalLink className="w-3 h-3 inline-block" />
              </a>
            );
          }
          return part;
        })}
      </div>
    );
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 relative overflow-hidden ${
        status === 'burning'
          ? 'burning-glow border-amber-500/60'
          : status === 'completed'
          ? 'opacity-85 border-emerald-500/40'
          : status === 'failed'
          ? 'border-red-500/40'
          : 'hover:border-[var(--border-strong)]'
      }`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor:
          status === 'burning'
            ? '#f59e0b'
            : status === 'completed'
            ? '#10b981'
            : status === 'failed'
            ? '#ef4444'
            : 'var(--border-subtle)',
      }}
    >
      {/* Solid Top Banner Stripe for status */}
      {status === 'burning' && (
        <div className="bg-amber-500 text-slate-950 px-4 py-1.5 flex items-center justify-between text-[11px] font-bold">
          <span className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>ГОРЯЩИЙ КВЕСТ · ДЕДЛАЙН МЕНЕЕ 48 ЧАСОВ!</span>
          </span>
          <span className="font-mono">{remaining.text}</span>
        </div>
      )}

      {status === 'failed' && (
        <div className="bg-red-600 text-white px-4 py-1.5 flex items-center justify-between text-[11px] font-bold">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>ПРОВАЛЕНО (ДЕДЛАЙН ИСТЕК)</span>
          </span>
          <span className="font-mono">{remaining.text}</span>
        </div>
      )}

      {status === 'completed' && (
        <div className="bg-emerald-600 text-white px-4 py-1.5 flex items-center justify-between text-[11px] font-bold">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>КВЕСТ ВЫПОЛНЕН</span>
          </span>
          <span className="text-[11px] font-mono">+{quest.baseExp} XP</span>
        </div>
      )}

      <div className="p-4 sm:p-5">
        {/* Header row: Course name + Delete button */}
        <div className="flex items-center justify-between gap-2 mb-2 text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-semibold text-[var(--accent-primary)] truncate max-w-[220px] sm:max-w-xs">
              {quest.courseName || 'Академический квест'}
            </span>
            {quest.instructor && (
              <>
                <span aria-hidden="true">·</span>
                <span className="truncate max-w-[140px]">{quest.instructor}</span>
              </>
            )}
          </div>

          {/* Delete Quest Action */}
          <div className="flex items-center gap-1 shrink-0">
            {showConfirmDelete ? (
              <div className="flex items-center gap-1.5 animate-fadeIn">
                <span className="text-[11px] text-red-500 font-semibold">Удалить?</span>
                <button
                  onClick={() => onDeleteQuest(quest.id)}
                  className="px-2 py-0.5 rounded text-[11px] bg-red-600 text-white font-bold hover:bg-red-700"
                >
                  Да
                </button>
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-2 py-0.5 rounded text-[11px] border text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  Нет
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmDelete(true)}
                title="Удалить квест"
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Title & Rank badge */}
        <div className="flex items-start justify-between gap-3">
          <h3
            className={`text-base sm:text-lg font-bold tracking-tight text-[var(--text-main)] ${
              quest.isCompleted ? 'line-through opacity-70' : ''
            }`}
          >
            {quest.cleanTitle}
          </h3>

          {/* Difficulty Rank & Reward Pill */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border"
              style={{
                borderColor: 'var(--border-subtle)',
                backgroundColor: 'var(--bg-surface-hover)',
                color: 'var(--accent-primary)',
              }}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>+{quest.baseExp} XP</span>
            </div>
          </div>
        </div>

        {/* Difficulty Rank Selector (S, A, B, C, D, E, F) */}
        <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t text-xs"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <span className="text-[var(--text-muted)] font-medium">Сложность:</span>
          <div className="flex items-center gap-1">
            {RANK_LIST.map((r) => {
              const info = QUEST_RANKS[r];
              const isSelected = quest.difficulty === r;
              return (
                <button
                  key={r}
                  onClick={() => onChangeDifficulty(quest.id, r)}
                  title={`${info.label} (+${info.exp} XP)`}
                  className={`w-6 h-6 rounded-md font-mono text-xs font-bold transition-all flex items-center justify-center ${
                    isSelected ? 'ring-2 ring-offset-1 ring-[var(--accent-primary)] shadow-sm scale-105' : 'opacity-65 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: info.badgeBg,
                    color: info.badgeText,
                  }}
                >
                  {r}
                </button>
              );
            })}
          </div>

          <span className="text-[11px] text-[var(--text-muted)] font-mono ml-auto">
            <Clock className="w-3 h-3 inline mr-1" />
            {quest.localDeadline}
          </span>
        </div>

        {/* Description */}
        <div className="mt-3">
          {isExpanded ? (
            <div
              className="p-3 rounded-xl border mt-2"
              style={{
                borderColor: 'var(--border-subtle)',
                backgroundColor: 'var(--bg-surface-hover)',
              }}
            >
              {renderFormattedDescription(quest.description)}
            </div>
          ) : (
            <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
              {quest.description || 'Нет описания в календаре.'}
            </p>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-1.5 text-xs font-semibold text-[var(--accent-primary)] hover:underline flex items-center gap-1"
          >
            <span>{isExpanded ? 'Свернуть описание' : 'Развернуть описание и ссылки'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Linked Skill Selector (with clean background matching light/dark theme) */}
        <div
          className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-3 border-t text-xs"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-muted)] flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span>Прокачиваемый навык:</span>
            </span>
            <select
              value={quest.linkedSkillId}
              onChange={(e) => onChangeLinkedSkill(quest.id, e.target.value)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium border cursor-pointer focus:outline-none"
              style={{
                borderColor: 'var(--border-subtle)',
              }}
            >
              {skills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (Ур.{s.level})
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-[var(--text-muted)] font-mono">
            Чеклист: <span className="font-bold text-[var(--text-main)]">{completedSubquests}/{totalSubquests}</span>
          </div>
        </div>

        {/* Subquests Section */}
        <div className="mt-3 space-y-2">
          {quest.subquests.map((sq: SubQuest) => (
            <div
              key={sq.id}
              className={`flex items-center justify-between gap-3 p-2 rounded-xl text-xs border transition-colors ${
                sq.isCompleted
                  ? 'border-emerald-500/30 text-[var(--text-muted)]'
                  : 'hover:border-[var(--border-strong)]'
              }`}
              style={{
                borderColor: sq.isCompleted ? undefined : 'var(--border-subtle)',
                backgroundColor: sq.isCompleted ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface-hover)',
              }}
            >
              <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sq.isCompleted}
                  onChange={() => onToggleSubquest(quest.id, sq.id)}
                  className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] cursor-pointer shrink-0"
                />
                <span className={`break-words ${sq.isCompleted ? 'line-through opacity-70' : 'text-[var(--text-main)]'}`}>
                  {sq.text}
                </span>
              </label>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-mono text-emerald-500 font-semibold whitespace-nowrap">
                  +{sq.exp} XP
                </span>
                <button
                  onClick={() => onDeleteSubquest(quest.id, sq.id)}
                  className="text-[var(--text-muted)] hover:text-red-500 p-1 transition-colors"
                  title="Удалить шаг"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Add Subquest */}
          {isAddingSubquest ? (
            <form onSubmit={handleCreateSubquest} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Новый шаг квеста..."
                value={newSubquestText}
                onChange={(e) => setNewSubquestText(e.target.value)}
                autoFocus
                className="flex-1 px-3 py-1.5 rounded-lg text-xs border bg-transparent text-[var(--text-main)] placeholder-[var(--text-muted)]"
                style={{ borderColor: 'var(--accent-primary)' }}
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white whitespace-nowrap"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                Добавить
              </button>
              <button
                type="button"
                onClick={() => setIsAddingSubquest(false)}
                className="px-2 py-1.5 rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                Отмена
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingSubquest(true)}
              className="text-xs font-medium text-[var(--accent-primary)] hover:underline flex items-center gap-1 pt-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Добавить шаг квеста (+20 XP)</span>
            </button>
          )}
        </div>

        {/* Action Button */}
        <div
          className="mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-3"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="text-xs text-[var(--text-muted)] font-mono">
            {status === 'burning' && <span className="text-amber-500 font-bold">Осталось: {remaining.text}</span>}
            {status === 'active' && <span>Дедлайн через {remaining.text}</span>}
            {status === 'failed' && <span className="text-red-500 font-semibold">Срок сдачи прошел</span>}
            {status === 'completed' && <span className="text-emerald-500 font-semibold">Сдано</span>}
          </div>

          <div className="flex items-center gap-2">
            {quest.isCompleted ? (
              <button
                onClick={() => onUncompleteQuest(quest.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                Вернуть в работу
              </button>
            ) : (
              <button
                onClick={() => onCompleteQuest(quest.id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white shadow-sm transition-all active:scale-95"
                style={{
                  backgroundColor: '#10b981',
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Завершить квест (+{quest.baseExp} XP)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
