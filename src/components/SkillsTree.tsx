import React, { useState } from 'react';
import { Skill, Quest } from '../types';
import { Plus, Award, BookOpen, Layers, CheckCircle2, Edit3, Trash2, X, Sparkles } from 'lucide-react';

interface SkillsTreeProps {
  skills: Skill[];
  quests: Quest[];
  onAddSkill: (newSkill: Omit<Skill, 'id' | 'points'>) => void;
  onEditSkill: (updatedSkill: Skill) => void;
  onDeleteSkill: (skillId: string) => void;
}

export const SkillsTree: React.FC<SkillsTreeProps> = ({
  skills,
  quests,
  onAddSkill,
  onEditSkill,
  onDeleteSkill,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);

  // Form state for add/edit
  const [skillName, setSkillName] = useState('');
  const [skillDesc, setSkillDesc] = useState('');
  const [skillColor, setSkillColor] = useState('#2563eb');
  const [keywords, setKeywords] = useState('');
  const [skillToDelete, setSkillToDelete] = useState<string | null>(null);

  const presetColors = ['#2563eb', '#06b6d4', '#7c3aed', '#ea580c', '#10b981', '#dc2626', '#475569'];

  const handleOpenAdd = () => {
    setSkillName('');
    setSkillDesc('');
    setSkillColor('#2563eb');
    setKeywords('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (skill: Skill) => {
    setEditingSkill(skill);
    setSkillName(skill.name);
    setSkillDesc(skill.description);
    setSkillColor(skill.color);
    setKeywords(skill.courseKeywords.join(', '));
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim()) return;

    onAddSkill({
      name: skillName.trim(),
      description: skillDesc.trim() || 'Пользовательский академический навык',
      color: skillColor,
      icon: 'Award',
      courseKeywords: keywords
        .split(',')
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean),
    });

    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSkill || !skillName.trim()) return;

    onEditSkill({
      ...editingSkill,
      name: skillName.trim(),
      description: skillDesc.trim(),
      color: skillColor,
      courseKeywords: keywords
        .split(',')
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean),
    });

    setEditingSkill(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)] flex items-center gap-2">
            <Layers className="w-6 h-6 text-[var(--accent-primary)]" />
            <span>Академические навыки и компетенции</span>
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Копите баллы по дисциплинам, создавайте собственные ветки и редактируйте их в любой момент.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-sm transition-all active:scale-95 shrink-0"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        >
          <Plus className="w-4 h-4" />
          <span>Создать навык</span>
        </button>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {skills.map((skill) => {
          const linkedQuests = quests.filter((q) => q.linkedSkillId === skill.id);
          const completedLinked = linkedQuests.filter((q) => q.isCompleted).length;
          const totalLinked = linkedQuests.length;

          return (
            <div
              key={skill.id}
              className="rounded-2xl border p-5 transition-all relative overflow-hidden group hover:border-[var(--border-strong)] flex flex-col justify-between"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              {/* Decorative accent top bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: skill.color }}
              />

              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm"
                      style={{ backgroundColor: skill.color }}
                    >
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-[var(--text-main)]">
                        {skill.name}
                      </h3>
                      <div className="text-xs font-mono font-bold text-[var(--accent-primary)] mt-0.5">
                        {skill.points || 0} баллов накоплено
                      </div>
                    </div>
                  </div>

                  {/* Edit & Delete Quick Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(skill)}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                      title="Редактировать навык"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {skills.length > 1 && (
                      <button
                        onClick={() => setSkillToDelete(skill.id)}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title="Удалить навык"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4 line-clamp-2">
                  {skill.description}
                </p>

                {/* Keywords tags */}
                {skill.courseKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {skill.courseKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono px-2 py-0.5 rounded border text-[var(--text-muted)]"
                        style={{
                          borderColor: 'var(--border-subtle)',
                          backgroundColor: 'var(--bg-surface-hover)',
                        }}
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats Footer */}
              <div
                className="pt-3 border-t flex items-center justify-between text-xs text-[var(--text-muted)]"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span>
                    Заданий в ветке:{' '}
                    <span className="font-mono font-bold text-[var(--text-main)]">
                      {totalLinked}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-bold">{completedLinked} сдано</span>
                </div>
              </div>

              {/* Delete confirmation popup */}
              {skillToDelete === skill.id && (
                <div className="absolute inset-0 z-20 p-4 bg-black/85 backdrop-blur-sm flex flex-col justify-center items-center text-center animate-fadeIn">
                  <div className="text-xs font-bold text-white mb-1">
                    Удалить навык «{skill.name}»?
                  </div>
                  <div className="text-[11px] text-slate-300 mb-3">
                    Привязанные задания останутся в системе.
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onDeleteSkill(skill.id);
                        setSkillToDelete(null);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700"
                    >
                      Да, удалить
                    </button>
                    <button
                      onClick={() => setSkillToDelete(null)}
                      className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-white hover:bg-slate-700"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: Add or Edit Skill */}
      {(isAddModalOpen || editingSkill) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-2xl border p-6 shadow-2xl animate-scaleIn"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-strong)',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <h3 className="text-base sm:text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--accent-primary)]" />
                <span>{editingSkill ? 'Редактировать навык' : 'Создать новый навык'}</span>
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingSkill(null);
                }}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={editingSkill ? handleSaveEdit : handleSaveAdd}
              className="space-y-4 mt-4"
            >
              <div>
                <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                  Название навыка *
                </label>
                <input
                  type="text"
                  required
                  placeholder="например: Backend Engineering"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs border bg-transparent text-[var(--text-main)] focus:outline-none"
                  style={{ borderColor: 'var(--border-subtle)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                  Описание компетенций
                </label>
                <textarea
                  rows={2}
                  placeholder="Какие дисциплины и практические темы охватывает навык..."
                  value={skillDesc}
                  onChange={(e) => setSkillDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs border bg-transparent text-[var(--text-main)] focus:outline-none"
                  style={{ borderColor: 'var(--border-subtle)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                  Ключевые слова для привязки к курсам (через запятую)
                </label>
                <input
                  type="text"
                  placeholder="backend, api, sql, postgresql, node"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs border bg-transparent text-[var(--text-main)] focus:outline-none font-mono"
                  style={{ borderColor: 'var(--border-subtle)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-main)] mb-1.5">
                  Цвет маркера
                </label>
                <div className="flex items-center gap-2 pt-1">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSkillColor(color)}
                      className={`w-7 h-7 rounded-lg transition-transform ${
                        skillColor === color ? 'scale-110 ring-2 ring-offset-1 ring-white' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div
                className="flex items-center justify-end gap-3 pt-3 border-t"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingSkill(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] border"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-sm"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  {editingSkill ? 'Сохранить изменения' : 'Создать навык'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
