import React, { useState } from 'react';
import { PenaltyRule } from '../types';
import {
  AlertTriangle,
  Moon,
  Dumbbell,
  Footprints,
  GraduationCap,
  MinusCircle,
  X,
  Plus,
  Pencil,
  Trash2,
  Clock,
  Coffee,
  Flame,
  Zap,
  RotateCcw,
  Check,
} from 'lucide-react';

interface PenaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPoints: number;
  penalties: PenaltyRule[];
  onApplyPenalty: (points: number, reason: string) => void;
  onAddPenalty: (rule: Omit<PenaltyRule, 'id'>) => void;
  onEditPenalty: (rule: PenaltyRule) => void;
  onDeletePenalty: (id: string) => void;
  onResetPenaltiesToDefault: () => void;
}

const AVAILABLE_ICONS = [
  { id: 'alert', label: 'Внимание', component: AlertTriangle },
  { id: 'moon', label: 'Сон', component: Moon },
  { id: 'dumbbell', label: 'Спорт', component: Dumbbell },
  { id: 'footprints', label: 'Бег', component: Footprints },
  { id: 'graduation', label: 'Учеба', component: GraduationCap },
  { id: 'clock', label: 'Опоздание', component: Clock },
  { id: 'coffee', label: 'Отдых', component: Coffee },
  { id: 'flame', label: 'Срыв', component: Flame },
  { id: 'zap', label: 'Дисциплина', component: Zap },
];

export const PenaltyModal: React.FC<PenaltyModalProps> = ({
  isOpen,
  onClose,
  currentPoints,
  penalties,
  onApplyPenalty,
  onAddPenalty,
  onEditPenalty,
  onDeletePenalty,
  onResetPenaltiesToDefault,
}) => {
  // One-time instant penalty state
  const [instantReason, setInstantReason] = useState('');
  const [instantPoints, setInstantPoints] = useState(10);

  // Add / Edit form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPoints, setFormPoints] = useState(10);
  const [formIcon, setFormIcon] = useState('alert');

  if (!isOpen) return null;

  const handleApplyPreset = (points: number, reason: string) => {
    onApplyPenalty(points, reason);
  };

  const handleApplyInstant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instantReason.trim()) return;
    onApplyPenalty(Math.max(1, instantPoints), instantReason.trim());
    setInstantReason('');
  };

  const openAddForm = () => {
    setEditingId(null);
    setFormTitle('');
    setFormDescription('');
    setFormPoints(10);
    setFormIcon('alert');
    setIsFormOpen(true);
  };

  const openEditForm = (rule: PenaltyRule) => {
    setEditingId(rule.id);
    setFormTitle(rule.title);
    setFormDescription(rule.description);
    setFormPoints(rule.points);
    setFormIcon(rule.icon || 'alert');
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (editingId) {
      onEditPenalty({
        id: editingId,
        title: formTitle.trim(),
        description: formDescription.trim(),
        points: Math.max(1, formPoints),
        icon: formIcon,
      });
    } else {
      onAddPenalty({
        title: formTitle.trim(),
        description: formDescription.trim(),
        points: Math.max(1, formPoints),
        icon: formIcon,
      });
    }

    setIsFormOpen(false);
    setEditingId(null);
  };

  const renderIcon = (iconName?: string) => {
    switch (iconName) {
      case 'moon':
        return <Moon className="w-4 h-4 text-indigo-400" />;
      case 'dumbbell':
        return <Dumbbell className="w-4 h-4 text-emerald-500" />;
      case 'footprints':
        return <Footprints className="w-4 h-4 text-teal-400" />;
      case 'graduation':
        return <GraduationCap className="w-4 h-4 text-purple-400" />;
      case 'clock':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'coffee':
        return <Coffee className="w-4 h-4 text-orange-400" />;
      case 'flame':
        return <Flame className="w-4 h-4 text-rose-500" />;
      case 'zap':
        return <Zap className="w-4 h-4 text-yellow-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-2xl rounded-2xl border p-5 sm:p-6 shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'rgba(239, 68, 68, 0.4)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/15 border border-red-500/30 text-red-500 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
                <span>Система штрафов</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                  {penalties.length} правил
                </span>
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Фиксация нарушений режима и списание баллов с возможностью редактирования
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

        {/* Current Balance Notice & Add Button */}
        <div className="my-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div
            className="flex-1 p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono"
            style={{
              backgroundColor: 'var(--bg-surface-hover)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <span className="text-[var(--text-muted)]">Текущий баланс студента:</span>
            <span className="font-bold text-amber-500 text-sm">{currentPoints} б.</span>
          </div>

          <button
            onClick={openAddForm}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 shrink-0"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            <Plus className="w-4 h-4" />
            <span>Добавить свой штраф</span>
          </button>
        </div>

        {/* Add/Edit Penalty Form Modal / Box */}
        {isFormOpen && (
          <form
            onSubmit={handleSaveForm}
            className="mb-5 p-4 rounded-xl border space-y-3 animate-fadeIn"
            style={{
              backgroundColor: 'var(--bg-surface-hover)',
              borderColor: 'var(--accent-primary)',
            }}
          >
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                <Pencil className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>{editingId ? 'Редактирование штрафа' : 'Новое правило штрафа'}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-xs"
              >
                Отмена
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-muted)]">Название штрафа *</label>
                <input
                  type="text"
                  required
                  placeholder="Например: Залипание в соцсетях > 1 часа"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border bg-transparent text-[var(--text-main)] focus:outline-none"
                  style={{ borderColor: 'var(--border-subtle)' }}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-muted)]">Списание (баллов) *</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  required
                  value={formPoints}
                  onChange={(e) => setFormPoints(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border bg-transparent text-red-500 focus:outline-none"
                  style={{ borderColor: 'var(--border-subtle)' }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[var(--text-muted)]">Описание / Последствие</label>
              <input
                type="text"
                placeholder="Почему нарушение наказывается и к чему приводит..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border bg-transparent text-[var(--text-main)] focus:outline-none"
                style={{ borderColor: 'var(--border-subtle)' }}
              />
            </div>

            {/* Icon Picker */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[var(--text-muted)]">Иконка штрафа</label>
              <div className="flex flex-wrap items-center gap-1.5">
                {AVAILABLE_ICONS.map((ic) => {
                  const IconComp = ic.component;
                  const isSelected = formIcon === ic.id;
                  return (
                    <button
                      key={ic.id}
                      type="button"
                      onClick={() => setFormIcon(ic.id)}
                      className={`p-2 rounded-lg border flex items-center gap-1 text-xs transition-all ${
                        isSelected
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 font-bold'
                          : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                      <span className="text-[10px]">{ic.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm flex items-center gap-1"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{editingId ? 'Сохранить изменения' : 'Добавить штраф'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Penalties List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Список установленных штрафов
            </h4>
            <button
              type="button"
              onClick={onResetPenaltiesToDefault}
              title="Восстановить исходные 4 дисциплинарных штрафа"
              className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-main)] underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Сброс к стандартным</span>
            </button>
          </div>

          {penalties.map((rule) => (
            <div
              key={rule.id}
              className="p-3 sm:p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:border-red-500/40"
              style={{
                backgroundColor: 'var(--bg-surface-hover)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  {renderIcon(rule.icon)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-[var(--text-main)] truncate">{rule.title}</span>
                    <span className="text-xs font-mono font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                      -{rule.points} б.
                    </span>
                  </div>
                  {rule.description && (
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug">
                      {rule.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => openEditForm(rule)}
                  title="Редактировать штраф"
                  className="p-1.5 rounded-lg border text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--accent-primary)] transition-colors"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onDeletePenalty(rule.id)}
                  title="Удалить штраф"
                  className="p-1.5 rounded-lg border text-[var(--text-muted)] hover:text-red-500 hover:border-red-500/30 transition-colors"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleApplyPreset(rule.points, rule.title)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center gap-1 shadow-sm"
                >
                  <MinusCircle className="w-3.5 h-3.5" />
                  <span>Штраф -{rule.points} б.</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Instant Custom Penalty Form (One-off) */}
        <form onSubmit={handleApplyInstant} className="mt-5 pt-4 border-t space-y-2" style={{ borderColor: 'var(--border-subtle)' }}>
          <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Разовый произвольный штраф
          </h4>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              placeholder="Причина (например: опоздание, отвлечение на соцсети...)"
              value={instantReason}
              onChange={(e) => setInstantReason(e.target.value)}
              className="w-full sm:flex-1 px-3 py-2 text-xs rounded-xl border bg-transparent text-[var(--text-main)] focus:outline-none"
              style={{ borderColor: 'var(--border-subtle)' }}
            />

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="number"
                min={1}
                max={500}
                value={instantPoints}
                onChange={(e) => setInstantPoints(Number(e.target.value))}
                className="w-20 px-2.5 py-2 text-xs font-mono font-bold rounded-xl border bg-transparent text-red-500 focus:outline-none"
                style={{ borderColor: 'var(--border-subtle)' }}
              />

              <button
                type="submit"
                disabled={!instantReason.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-all shrink-0 whitespace-nowrap"
              >
                Оштрафовать
              </button>
            </div>
          </div>
        </form>

        {/* Close Button */}
        <div className="pt-4 border-t mt-4 flex justify-end" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] border"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
