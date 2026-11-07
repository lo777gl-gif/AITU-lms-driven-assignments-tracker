import React, { useState } from 'react';
import { Skill, Quest, QuestRank, RecurrenceType } from '../types';
import { formatToAstanaTime, timestampToDateTimeLocal, dateTimeLocalToTimestamp } from '../utils/icsParser';
import { QUEST_RANKS, RANK_LIST, WEEKDAYS, RECURRENCE_OPTIONS, getRankPointsForTarget } from '../utils/levelMath';
import { Plus, X, Repeat, Calendar, Check, Sparkles } from 'lucide-react';

interface CustomQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  skills: Skill[];
  onCreateQuest: (quest: Quest) => void;
  weeklyTargetPoints?: number;
}

export const CustomQuestModal: React.FC<CustomQuestModalProps> = ({
  isOpen,
  onClose,
  skills,
  onCreateQuest,
  weeklyTargetPoints = 200,
}) => {
  const [title, setTitle] = useState('');
  const [courseName, setCourseName] = useState('Самостоятельная работа');
  const [description, setDescription] = useState('');
  const [deadlineStr, setDeadlineStr] = useState(() => {
    const d = new Date(Date.now() + 2 * 24 * 3600 * 1000);
    d.setHours(20, 0, 0, 0);
    return timestampToDateTimeLocal(d.getTime());
  });
  const [linkedSkillId, setLinkedSkillId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<QuestRank>('A');
  const [points, setPoints] = useState<number>(() => getRankPointsForTarget('A', weeklyTargetPoints));
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('daily');
  const [recurrenceDays, setRecurrenceDays] = useState<number>(3);
  const [recurrenceWeekdays, setRecurrenceWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [recurrenceTime, setRecurrenceTime] = useState<string>('23:00');

  // Keep points synchronized with weekly target points when modal is opened or target changes
  React.useEffect(() => {
    setPoints(getRankPointsForTarget(difficulty, weeklyTargetPoints));
  }, [difficulty, weeklyTargetPoints]);

  if (!isOpen) return null;

  const handleDifficultyChange = (rank: QuestRank) => {
    setDifficulty(rank);
    setPoints(getRankPointsForTarget(rank, weeklyTargetPoints));
  };

  const toggleWeekday = (dayId: number) => {
    if (recurrenceWeekdays.includes(dayId)) {
      if (recurrenceWeekdays.length === 1) return;
      setRecurrenceWeekdays(recurrenceWeekdays.filter((d) => d !== dayId));
    } else {
      setRecurrenceWeekdays([...recurrenceWeekdays, dayId].sort((a, b) => a - b));
    }
  };

  // Quick Presets
  const applyPreset = (presetName: string) => {
    if (presetName === 'sleep') {
      setTitle('Сон до 23:00');
      setCourseName('Режим дня');
      setDescription('Лечь спать вовремя для полноценного сна и ясного ума');
      setDifficulty('F');
      setPoints(getRankPointsForTarget('F', weeklyTargetPoints));
      setIsRecurring(true);
      setRecurrenceType('daily');
      setRecurrenceTime('23:00');
    } else if (presetName === 'workout') {
      setTitle('Утренняя тренировка');
      setCourseName('Спорт и здоровье');
      setDescription('Зарядка, ОФП или разминка 20-30 минут');
      setDifficulty('F');
      setPoints(getRankPointsForTarget('F', weeklyTargetPoints));
      setIsRecurring(true);
      setRecurrenceType('weekdays');
      setRecurrenceWeekdays([1, 2, 3, 4, 5]);
      setRecurrenceTime('09:00');
    } else if (presetName === 'running') {
      setTitle('Бег');
      setCourseName('Спорт и здоровье');
      setDescription('Кардио-пробежка на свежем воздухе');
      setDifficulty('F');
      setPoints(getRankPointsForTarget('F', weeklyTargetPoints));
      setIsRecurring(true);
      setRecurrenceType('weekdays');
      setRecurrenceWeekdays([1, 3, 5]);
      setRecurrenceTime('08:30');
    } else if (presetName === 'sdp') {
      setTitle('Лабораторная по Software Design Patterns (SDP)');
      setCourseName('Software Design Patterns');
      setDescription('Сложное задание: архитектурные паттерны и реализация');
      setDifficulty('S');
      setPoints(getRankPointsForTarget('S', weeklyTargetPoints));
      setIsRecurring(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const deadlineTimestamp = dateTimeLocalToTimestamp(deadlineStr);
    const uid = `custom-quest-${Date.now()}`;
    const finalPoints = Math.max(5, points);

    const newQuest: Quest = {
      id: uid,
      summary: title.trim(),
      cleanTitle: title.trim(),
      description: description.trim(),
      categories: courseName.trim() || 'Общее',
      courseName: courseName.trim() || 'Общее',
      instructor: 'Пользовательское задание',
      dtStart: new Date().toISOString(),
      dtEnd: new Date(deadlineTimestamp).toISOString(),
      localDeadline: formatToAstanaTime(deadlineTimestamp),
      deadlineTimestamp,
      isCompleted: false,
      linkedSkillId,
      points: finalPoints,
      baseExp: finalPoints,
      difficulty,
      isCustom: true,
      isRecurring,
      recurrenceType: isRecurring ? recurrenceType : undefined,
      recurrenceDays: isRecurring && recurrenceType === 'interval_days' ? recurrenceDays : undefined,
      recurrenceWeekdays: isRecurring && recurrenceType === 'weekdays' ? recurrenceWeekdays : undefined,
      recurrenceTime: isRecurring ? recurrenceTime : undefined,
      completedCount: 0,
      isTodayAgenda: isRecurring && recurrenceType === 'daily',
    };

    onCreateQuest(newQuest);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div
        className="w-full max-w-xl rounded-2xl border p-6 shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto"
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
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shadow-sm"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-main)]">
                Новое задание
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Создание задачи, привычки на день или университетского квеста
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

        {/* Quick Presets Bar */}
        <div className="my-3.5">
          <span className="text-[11px] font-semibold text-[var(--text-muted)] mb-1.5 block">
            Быстрые шаблоны:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => applyPreset('sleep')}
              className="px-2.5 py-1 rounded-lg text-xs font-medium border text-[var(--text-main)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              🌙 Сон до 23:00 ({getRankPointsForTarget('F', weeklyTargetPoints)} б.)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('workout')}
              className="px-2.5 py-1 rounded-lg text-xs font-medium border text-[var(--text-main)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              🏋️ Тренировка ({getRankPointsForTarget('F', weeklyTargetPoints)} б.)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('running')}
              className="px-2.5 py-1 rounded-lg text-xs font-medium border text-[var(--text-main)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              🏃 Бег ({getRankPointsForTarget('F', weeklyTargetPoints)} б.)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('sdp')}
              className="px-2.5 py-1 rounded-lg text-xs font-medium border text-[var(--text-main)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              💻 Задание по SDP ({getRankPointsForTarget('S', weeklyTargetPoints)} б.)
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
              Название задания *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Сон до 23:00 или Лабораторная по SDP"
              className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm border bg-transparent text-[var(--text-main)] focus:outline-none"
              style={{ borderColor: 'var(--border-subtle)' }}
            />
          </div>

          {/* Course / Category & Skill */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                Курс или категория
              </label>
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="Software Design Patterns, Режим дня, Спорт..."
                className="w-full px-3 py-2 rounded-xl text-xs border bg-transparent text-[var(--text-main)] focus:outline-none"
                style={{ borderColor: 'var(--border-subtle)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                Связанный навык
              </label>
              <select
                value={linkedSkillId}
                onChange={(e) => setLinkedSkillId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none bg-[var(--bg-surface)] text-[var(--text-main)]"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <option value="">(Не выбрано)</option>
                {skills.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Deadline Picker */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-main)] mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span>Дедлайн / Время выполнения (Астана, UTC+5) *</span>
            </label>
            <input
              type="datetime-local"
              required
              value={deadlineStr}
              onChange={(e) => setDeadlineStr(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm border bg-transparent text-[var(--text-main)] font-mono focus:outline-none"
              style={{ borderColor: 'var(--border-subtle)' }}
            />
          </div>

          {/* Difficulty & Points */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-main)] mb-2">
              Сложность и награда в баллах
            </label>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {RANK_LIST.map((rank) => {
                const info = QUEST_RANKS[rank];
                const scaledPoints = getRankPointsForTarget(rank, weeklyTargetPoints);
                const isSelected = difficulty === rank;
                return (
                  <button
                    key={rank}
                    type="button"
                    onClick={() => handleDifficultyChange(rank)}
                    className={`py-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSelected ? 'ring-2 ring-offset-1 ring-[var(--accent-primary)] scale-[1.03]' : 'opacity-75 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: isSelected ? info.badgeBg : 'var(--bg-surface-hover)',
                      borderColor: isSelected ? info.badgeBorder : 'var(--border-subtle)',
                      color: isSelected ? info.badgeText : 'var(--text-main)',
                    }}
                  >
                    <span className="font-mono font-bold text-xs sm:text-sm">{rank}</span>
                    <span className="text-[10px] mt-0.5 opacity-90 font-mono font-semibold">{scaledPoints} б.</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Points input */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-[var(--text-main)] whitespace-nowrap">
              Точные баллы:
            </label>
            <input
              type="number"
              min={1}
              max={Math.max(500, weeklyTargetPoints * 2)}
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="w-24 px-3 py-1 rounded-xl text-xs font-mono font-bold border bg-transparent text-[var(--text-main)] focus:outline-none"
              style={{ borderColor: 'var(--border-subtle)' }}
            />
            <span className="text-xs text-[var(--text-muted)] font-mono">
              (Недельная цель: {weeklyTargetPoints} б.)
            </span>
          </div>

          {/* Recurring Task Settings */}
          <div
            className="p-3.5 rounded-xl border space-y-3"
            style={{
              backgroundColor: 'var(--bg-surface-hover)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="rounded border-[var(--border-subtle)] text-[var(--accent-primary)] w-4 h-4"
              />
              <span className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-purple-500" />
                <span>Повторяющееся задание (привычка / цикл)</span>
              </span>
            </label>

            {isRecurring && (
              <div className="space-y-3 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                {/* 3 allowed recurrence options */}
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1.5">
                    Режим повторения:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {RECURRENCE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setRecurrenceType(opt.id)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                          recurrenceType === opt.id
                            ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                            : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                        style={{ borderColor: 'var(--border-subtle)' }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Option 2: Interval Days (Раз в N дней) */}
                {recurrenceType === 'interval_days' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-muted)]">Повторять каждые:</span>
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={recurrenceDays}
                      onChange={(e) => setRecurrenceDays(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 px-2.5 py-1 text-xs rounded-lg border font-mono bg-transparent text-[var(--text-main)] focus:outline-none"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    />
                    <span className="text-xs text-[var(--text-muted)]">дней</span>
                  </div>
                )}

                {/* Option 3: Weekdays (Выбрать дни недели) */}
                {recurrenceType === 'weekdays' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1.5">
                      Выберите дни недели:
                    </label>
                    <div className="grid grid-cols-7 gap-1.5">
                      {WEEKDAYS.map((w) => {
                        const isDaySelected = recurrenceWeekdays.includes(w.id);
                        return (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => toggleWeekday(w.id)}
                            title={w.full}
                            className={`py-2 rounded-lg text-xs font-bold font-mono border transition-all ${
                              isDaySelected
                                ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                                : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
                            }`}
                            style={{ borderColor: isDaySelected ? '#9333ea' : 'var(--border-subtle)' }}
                          >
                            {w.short}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Configurable recurrence time */}
                <div className="pt-2 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-main)]">
                      Время обновления / дедлайна (Астана, UTC+5):
                    </label>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      В это время суток задача обновится для следующего выполнения
                    </span>
                  </div>
                  <input
                    type="time"
                    required
                    value={recurrenceTime}
                    onChange={(e) => setRecurrenceTime(e.target.value || '23:00')}
                    className="w-32 px-2.5 py-1 text-xs rounded-lg border font-mono font-bold bg-transparent text-[var(--text-main)] focus:outline-none"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
              Краткое примечание (необязательно)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Дополнительные детали..."
              className="w-full px-3 py-2 rounded-xl text-xs border bg-transparent text-[var(--text-main)] focus:outline-none"
              style={{ borderColor: 'var(--border-subtle)' }}
            />
          </div>

          {/* Actions */}
          <div
            className="pt-4 border-t flex items-center justify-end gap-3"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
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
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <Check className="w-4 h-4" />
              <span>Создать квест</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
