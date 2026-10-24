import React, { useState } from 'react';
import { Skill, Quest } from '../types';
import { getRankTitle } from '../utils/levelMath';
import { Plus, Award, BookOpen, Layers, CheckCircle2, Zap, Sparkles, TrendingUp } from 'lucide-react';

interface SkillsTreeProps {
  skills: Skill[];
  quests: Quest[];
  onAddSkill: (newSkill: Omit<Skill, 'id' | 'level' | 'exp' | 'maxExp'>) => void;
}

export const SkillsTree: React.FC<SkillsTreeProps> = ({ skills, quests, onAddSkill }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [skillName, setSkillName] = useState('');
  const [skillDesc, setSkillDesc] = useState('');
  const [skillColor, setSkillColor] = useState('#06b6d4');
  const [keywords, setKeywords] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim()) return;

    onAddSkill({
      name: skillName.trim(),
      description: skillDesc.trim() || 'Пользовательский навык студента',
      color: skillColor,
      icon: 'Award',
      courseKeywords: keywords
        .split(',')
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean),
    });

    setSkillName('');
    setSkillDesc('');
    setKeywords('');
    setIsModalOpen(false);
  };

  const presetColors = ['#06b6d4', '#a855f7', '#eab308', '#3b82f6', '#10b981', '#f43f5e', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Header section with Create Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)] flex items-center gap-2">
            <Layers className="w-6 h-6 text-[var(--accent-primary)]" />
            <span>Дерево академических навыков</span>
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Выполняйте задания курсов, чтобы прокачивать дисциплины и открывать новые звания мастерства.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-sm transition-all active:scale-95 shrink-0"
          style={{
            backgroundColor: 'var(--accent-primary)',
          }}
        >
          <Plus className="w-4 h-4" />
          <span>Создать навык</span>
        </button>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {skills.map((skill) => {
          const rank = getRankTitle(skill.level);
          const percent = Math.min(100, Math.round((skill.exp / skill.maxExp) * 100));

          // Linked quests stats
          const linkedQuests = quests.filter((q) => q.linkedSkillId === skill.id);
          const completedLinked = linkedQuests.filter((q) => q.isCompleted).length;
          const totalLinked = linkedQuests.length;

          return (
            <div
              key={skill.id}
              className="rounded-2xl border p-5 transition-all relative overflow-hidden group hover:border-[var(--border-strong)]"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              {/* Decorative accent top line */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: skill.color }}
              />

              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow"
                    style={{ backgroundColor: skill.color }}
                  >
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-[var(--text-main)] group-hover:text-[var(--accent-primary)] transition-colors">
                      {skill.name}
                    </h3>
                    <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 font-mono">
                      <span className="font-bold" style={{ color: skill.color }}>Уровень {skill.level}</span>
                      <span aria-hidden="true">·</span>
                      <span>Ранг {rank.tier}</span>
                    </div>
                  </div>
                </div>

                <div
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: `${skill.color}20`,
                    color: skill.color,
                    border: `1px solid ${skill.color}40`,
                  }}
                >
                  {rank.title}
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4 line-clamp-2">
                {skill.description}
              </p>

              {/* EXP Progress bar */}
              <div className="space-y-1.5 mb-4 font-mono text-xs">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[var(--text-muted)] flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-[var(--accent-primary)]" />
                    <span>Прогресс до Ур.{skill.level + 1}</span>
                  </span>
                  <span className="font-bold text-[var(--text-main)]">
                    {skill.exp} / {skill.maxExp} XP ({percent}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-black/25 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: skill.color,
                      boxShadow: `0 0 10px ${skill.color}80`,
                    }}
                  />
                </div>
              </div>

              {/* Stats Footer */}
              <div
                className="pt-3 border-t flex items-center justify-between text-xs text-[var(--text-muted)]"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span>Квестов в ветке: <span className="font-mono font-bold text-[var(--text-main)]">{totalLinked}</span></span>
                </div>

                <div className="flex items-center gap-1.5 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">{completedLinked} сдано</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add New Skill */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-2xl border p-6 shadow-2xl animate-scaleIn"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-strong)',
            }}
          >
            <h3 className="text-lg font-bold text-[var(--text-main)] mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[var(--accent-primary)]" />
              <span>Создать новый навык персонажа</span>
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              Создайте кастомную ветку развития (например, «Backend», «Machine Learning», «Cybersecurity»).
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                  Название навыка *
                </label>
                <input
                  type="text"
                  required
                  placeholder="например, Backend & Cloud Architecture"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs border bg-transparent text-[var(--text-main)] focus:outline-none"
                  style={{ borderColor: 'var(--border-subtle)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                  Описание ветки
                </label>
                <textarea
                  rows={2}
                  placeholder="Какие дисциплины и компетенции охватывает навык..."
                  value={skillDesc}
                  onChange={(e) => setSkillDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs border bg-transparent text-[var(--text-main)] focus:outline-none"
                  style={{ borderColor: 'var(--border-subtle)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                  Ключевые слова для автопривязки к курсам Moodle (через запятую)
                </label>
                <input
                  type="text"
                  placeholder="backend, api, database, postgresql, node"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs border bg-transparent text-[var(--text-main)] focus:outline-none font-mono"
                  style={{ borderColor: 'var(--border-subtle)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                  Цвет ветки
                </label>
                <div className="flex items-center gap-2 pt-1">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSkillColor(color)}
                      className={`w-7 h-7 rounded-lg transition-transform ${
                        skillColor === color ? 'scale-110 ring-2 ring-white' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  Создать ветку
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
