import React from 'react';
import { ActivityLogItem } from '../types';
import { Shield, Zap, CheckCircle2, Award, RefreshCw, Trash2, Clock, Sparkles } from 'lucide-react';

interface ActivityLogViewProps {
  logs: ActivityLogItem[];
  onClearLogs: () => void;
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({ logs, onClearLogs }) => {
  const formatTime = (ts: number) => {
    return new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Asia/Almaty',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ts));
  };

  const getLogIcon = (type: ActivityLogItem['type']) => {
    switch (type) {
      case 'quest_delete':
        return <Trash2 className="w-4 h-4 text-red-500" />;
      case 'level_up':
        return <Award className="w-4 h-4 text-amber-500" />;
      case 'quest_complete':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'subquest_complete':
        return <Zap className="w-4 h-4 text-[var(--accent-primary)]" />;
      case 'skill_level_up':
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      case 'sync':
        return <RefreshCw className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-[var(--text-muted)]" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)] flex items-center gap-2">
            <Shield className="w-6 h-6 text-[var(--accent-primary)]" />
            <span>Журнал академических подвигов</span>
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Хронологическая летопись набранного опыта, завершенных этапов и побед над дедлайнами.
          </p>
        </div>

        {logs.length > 0 && (
          <button
            onClick={onClearLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border text-[var(--text-muted)] hover:text-red-400 hover:border-red-400 transition-colors"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Очистить журнал</span>
          </button>
        )}
      </div>

      {logs.length === 0 ? (
        <div
          className="rounded-2xl border p-12 text-center"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <Clock className="w-12 h-12 mx-auto text-[var(--text-muted)] opacity-40 mb-3" />
          <h3 className="font-bold text-base text-[var(--text-main)]">Журнал пока пуст</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto mt-1">
            Выполняйте квесты, отмечайте шаги чеклиста или синхронизируйте расписание, чтобы здесь появилась летопись подвигов.
          </p>
        </div>
      ) : (
        <div
          className="rounded-2xl border divide-y overflow-hidden shadow-sm"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-black/5 transition-colors"
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                  style={{
                    backgroundColor: 'rgba(var(--accent-primary), 0.08)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  {getLogIcon(log.type)}
                </div>

                <div className="min-w-0">
                  <div className="font-semibold text-xs sm:text-sm text-[var(--text-main)] truncate">
                    {log.title}
                  </div>
                  {log.details && (
                    <div className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                      {log.details}
                    </div>
                  )}
                  <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                    {formatTime(log.timestamp)} (Астана, UTC+5)
                  </div>
                </div>
              </div>

              {log.expGained > 0 && (
                <div
                  className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold shrink-0 border"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                  }}
                >
                  +{log.expGained} XP
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
