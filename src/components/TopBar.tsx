import React from 'react';
import { ThemeId } from '../types';
import { RefreshCw, Volume2, VolumeX, Pencil, Sun, Moon, Coins, Settings, User, AlertTriangle } from 'lucide-react';

interface TopBarProps {
  activeTab: 'quests' | 'skills' | 'timeline' | 'log';
  setActiveTab: (tab: 'quests' | 'skills' | 'timeline' | 'log') => void;
  currentTheme: ThemeId;
  onToggleTheme: () => void;
  isSyncing: boolean;
  onDirectSync: () => void;
  onOpenSyncModal: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  points: number;
  onOpenSpendModal: () => void;
  currentUsername: string;
  onOpenAccountModal: () => void;
  onOpenPenaltyModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  currentTheme,
  onToggleTheme,
  isSyncing,
  onDirectSync,
  onOpenSyncModal,
  soundEnabled,
  onToggleSound,
  points,
  onOpenSpendModal,
  currentUsername,
  onOpenAccountModal,
  onOpenPenaltyModal,
}) => {
  return (
    <header
      className="sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Wordmark with Points indicator */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('quests')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white shadow-sm transition-transform group-hover:scale-105"
              style={{
                backgroundColor: 'var(--accent-primary)',
              }}
            >
              <Pencil className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-main)] whitespace-nowrap">
                QuestLog<span className="text-[var(--accent-primary)] font-mono text-sm ml-1">Tracker</span>
              </span>
              <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 font-mono">
                <span>Балловая система</span>
              </div>
            </div>
          </button>

          {/* Quick Points Badge & Spend trigger */}
          <button
            onClick={onOpenSpendModal}
            title="Списать баллы на вознаграждения"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-xs font-bold transition-all hover:border-amber-400"
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              borderColor: 'rgba(245, 158, 11, 0.3)',
              color: '#d97706',
            }}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>{points} б.</span>
            <span className="text-[10px] text-[var(--text-muted)] font-normal ml-0.5 underline">Списать</span>
          </button>

          {/* Quick Penalty Modal trigger */}
          <button
            onClick={onOpenPenaltyModal}
            title="Применить штраф за нарушение режима сна, тренировки или срыв дедлайна"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-xs font-bold transition-all text-red-500 hover:bg-red-500/10 active:scale-95"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              borderColor: 'rgba(239, 68, 68, 0.3)',
            }}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Штрафы</span>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('quests')}
            className={`transition-colors whitespace-nowrap py-1 relative ${
              activeTab === 'quests'
                ? 'text-[var(--accent-primary)] font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Квесты
            {activeTab === 'quests' && (
              <span
                className="absolute bottom-0 left-0 w-full h-0.5 rounded-full"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab('skills')}
            className={`transition-colors whitespace-nowrap py-1 relative ${
              activeTab === 'skills'
                ? 'text-[var(--accent-primary)] font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Навыки
            {activeTab === 'skills' && (
              <span
                className="absolute bottom-0 left-0 w-full h-0.5 rounded-full"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`transition-colors whitespace-nowrap py-1 relative ${
              activeTab === 'timeline'
                ? 'text-[var(--accent-primary)] font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Таймлайн
            {activeTab === 'timeline' && (
              <span
                className="absolute bottom-0 left-0 w-full h-0.5 rounded-full"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab('log')}
            className={`transition-colors whitespace-nowrap py-1 relative ${
              activeTab === 'log'
                ? 'text-[var(--accent-primary)] font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Журнал
            {activeTab === 'log' && (
              <span
                className="absolute bottom-0 left-0 w-full h-0.5 rounded-full"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              />
            )}
          </button>
        </nav>

        {/* Zone 3: Actions (Sound, Theme Toggle, 1-Click Sync, URL Settings) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Звук включен' : 'Звук выключен'}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors border"
            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[var(--accent-primary)]" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Simple Theme Toggle (Dark / Light only) */}
          <button
            onClick={onToggleTheme}
            title={currentTheme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium border text-[var(--text-main)] hover:border-[var(--accent-primary)] transition-colors"
            style={{
              borderColor: 'var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            {currentTheme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Светлая</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-blue-500" />
                <span className="hidden sm:inline">Тёмная</span>
              </>
            )}
          </button>

          {/* Direct 1-Click Sync Button (No modal opened) */}
          <button
            onClick={onDirectSync}
            disabled={isSyncing}
            title="Мгновенная синхронизация расписания в 1 клик"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all shadow-sm active:scale-95 disabled:opacity-75"
            style={{
              backgroundColor: 'var(--accent-primary)',
            }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="whitespace-nowrap">
              {isSyncing ? 'Синхронизация...' : 'Синхронизировать'}
            </span>
          </button>

          {/* Account Profile / Switcher button */}
          <button
            onClick={onOpenAccountModal}
            title={`Текущий аккаунт: ${currentUsername}. Нажмите для смены или регистрации`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold font-mono text-[var(--text-main)] hover:border-[var(--accent-primary)] transition-colors"
            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}
          >
            <User className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span className="max-w-[70px] sm:max-w-[110px] truncate">{currentUsername}</span>
          </button>

          {/* Modal trigger for configuring custom LMS URL / uploading .ics */}
          <button
            onClick={onOpenSyncModal}
            title="Настройки ссылки Moodle LMS и импорт .ics"
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--accent-primary)] transition-colors border"
            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Tab Strip & Mobile Points Bar */}
      <div
        className="md:hidden flex items-center justify-between border-t py-1.5 px-3 text-xs"
        style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('quests')}
            className={`px-2 py-1 font-medium ${
              activeTab === 'quests' ? 'text-[var(--accent-primary)] font-bold' : 'text-[var(--text-muted)]'
            }`}
          >
            Квесты
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`px-2 py-1 font-medium ${
              activeTab === 'skills' ? 'text-[var(--accent-primary)] font-bold' : 'text-[var(--text-muted)]'
            }`}
          >
            Навыки
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-2 py-1 font-medium ${
              activeTab === 'timeline' ? 'text-[var(--accent-primary)] font-bold' : 'text-[var(--text-muted)]'
            }`}
          >
            Таймлайн
          </button>
          <button
            onClick={() => setActiveTab('log')}
            className={`px-2 py-1 font-medium ${
              activeTab === 'log' ? 'text-[var(--accent-primary)] font-bold' : 'text-[var(--text-muted)]'
            }`}
          >
            Журнал
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenPenaltyModal}
            className="flex items-center gap-1 font-mono font-bold text-red-500 text-xs px-2 py-0.5 rounded border border-red-500/30"
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Штрафы</span>
          </button>

          <button
            onClick={onOpenSpendModal}
            className="flex items-center gap-1 font-mono font-bold text-amber-500 text-xs px-2 py-0.5 rounded border border-amber-500/30"
          >
            <Coins className="w-3 h-3" />
            <span>{points} б.</span>
          </button>
        </div>
      </div>
    </header>
  );
};
