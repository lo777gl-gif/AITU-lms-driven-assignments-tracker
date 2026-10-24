import React, { useState } from 'react';
import { Skill, Quest, SubQuest, QuestRank } from '../types';
import { formatToAstanaTime } from '../utils/icsParser';
import { QUEST_RANKS, RANK_LIST } from '../utils/levelMath';
import { Plus, X, Sparkles } from 'lucide-react';

interface CustomQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  skills: Skill[];
  onCreateQuest: (quest: Quest) => void;
}

export const CustomQuestModal: React.FC<CustomQuestModalProps> = ({
  isOpen,
  onClose,
  skills,
  onCreateQuest,
}) => {
  const [title, setTitle] = useState('');
  const [courseName, setCourseName] = useState('Самостоятельная работа');
  const [description, setDescription] = useState('');
  const [deadlineDays, setDeadlineDays] = useState(3);
  const [linkedSkillId, setLinkedSkillId] = useState(skills[0]?.id || 'skill-frontend');
  const [difficulty, setDifficulty] = useState<QuestRank>('C');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const deadlineTimestamp = Date.now() + deadlineDays * 24 * 3600 * 1000;
    const uid = `custom-quest-${Date.now()}`;
    const baseExp = QUEST_RANKS[difficulty].exp;

    const initialSubquests: SubQuest[] = [
      {
        id: `${uid}-sub-1`,
        text: 'Собрать материалы и составить план выполнения',
        isCompleted: false,
        exp: 20,
      },
      {
        id: `${uid}-sub-2`,
        text: 'Выполнить основной объем работы',
        isCompleted: false,
        exp: 25,
      },
      {
        id: `${uid}-sub-3`,
        text: 'Финальная проверка и завершение задачи',
        isCompleted: false,
        exp: 20,
      },
    ];

    const newQuest: Quest = {
      id: uid,
      summary: title.trim(),
      cleanTitle: title.trim(),
      description: description.trim() || 'Пользовательский академический квест',
      categories: `${courseName} | Студент`,
      courseName: courseName.trim(),
      instructor: 'Личный план',
      dtStart: new Date().toISOString(),
      dtEnd: new Date(deadlineTimestamp).toISOString(),
      localDeadline: formatToAstanaTime(deadlineTimestamp),
      deadlineTimestamp,
      isCompleted: false,
      subquests: initialSubquests,
      linkedSkillId,
      baseExp,
      difficulty,
      isCustom: true,
    };

    onCreateQuest(newQuest);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div
        className="w-full max-w-lg rounded-2xl border p-6 shadow-2xl animate-scaleIn"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-strong)',
        }}
      >
        <div
          className="flex items-center justify-between pb-4 border-b"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-sm"
              style={{
                backgroundColor: 'var(--accent-primary)',
              }}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-main)]">
              Создать личный квест
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
              Название задания / цели *
            </label>
            <input
              type="text"
              required
              placeholder="например: Подготовиться к защите DAA Assignment 3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs border bg-transparent text-[var(--text-main)] focus:outline-none"
              style={{ borderColor: 'var(--border-subtle)' }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                Курс или категория
              </label>
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="например: Algorithms & Data Structures"
                className="w-full px-3 py-2 rounded-xl text-xs border bg-transparent text-[var(--text-main)] focus:outline-none"
                style={{ borderColor: 'var(--border-subtle)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                Прокачиваемый навык
              </label>
              <select
                value={linkedSkillId}
                onChange={(e) => setLinkedSkillId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none cursor-pointer"
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
          </div>

          {/* Difficulty Rank S - F */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-main)] mb-1.5">
              Сложность задания (Ранг S — F)
            </label>
            <div className="grid grid-cols-7 gap-1.5">
              {RANK_LIST.map((r) => {
                const info = QUEST_RANKS[r];
                const isSelected = difficulty === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setDifficulty(r)}
                    className={`py-2 rounded-xl font-mono text-xs font-bold transition-all text-center flex flex-col items-center justify-center ${
                      isSelected ? 'ring-2 ring-offset-1 ring-[var(--accent-primary)] shadow-md' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: info.badgeBg,
                      color: info.badgeText,
                    }}
                  >
                    <span>{r}</span>
                    <span className="text-[10px] font-normal opacity-90">{info.exp}XP</span>
                  </button>
                );
              })}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1.5">
              Выбран: <span className="font-semibold text-[var(--text-main)]">{QUEST_RANKS[difficulty].label}</span> (+{QUEST_RANKS[difficulty].exp} XP)
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
              Срок выполнения (дедлайн)
            </label>
            <select
              value={deadlineDays}
              onChange={(e) => setDeadlineDays(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none cursor-pointer"
              style={{
                borderColor: 'var(--border-subtle)',
              }}
            >
              <option value={1}>Через 24 часа (Срочный! 🔥)</option>
              <option value={2}>Через 2 дня</option>
              <option value={3}>Через 3 дня</option>
              <option value={7}>Через 1 неделю</option>
              <option value={14}>Через 2 недели</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
              Заметки и ссылки к задаче
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ссылки на документацию, репозиторий GitHub или критерии оценки..."
              className="w-full px-3 py-2 rounded-xl text-xs border bg-transparent text-[var(--text-main)] focus:outline-none"
              style={{ borderColor: 'var(--border-subtle)' }}
            />
          </div>

          <div
            className="flex items-center justify-end gap-3 pt-4 border-t"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)]"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all active:scale-95"
              style={{
                backgroundColor: 'var(--accent-primary)',
              }}
            >
              Создать квест
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
