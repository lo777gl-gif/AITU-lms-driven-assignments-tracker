import React from 'react';
import { ThemeId } from '../types';
import { RefreshCw, Volume2, VolumeX, Shield, Sun, Moon } from 'lucide-react';

interface TopBarProps {
  activeTab: 'quests' | 'skills' | 'timeline' | 'log';
  setActiveTab: (tab: 'quests' | 'skills' | 'timeline' | 'log') => void;
  currentTheme: ThemeId;
  onToggleTheme: () => void;
  isSyncing: boolean;
  onOpenSyncModal: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  playerLevel: number;
  playerExp: number;
  maxExp: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  currentTheme,
  onToggleTheme,
  isSyncing,
  onOpenSyncModal,
  soundEnabled,
  onToggleSound,
  playerLevel,
  playerExp,
  maxExp,
}) => {
  const expPercent = Math.min(100, Math.round((playerExp / maxExp) * 100));

  return (
    <header
      className="sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Wordmark with Level indicator */}
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
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-main)] whitespace-nowrap">
                QuestLog<span className="text-[var(--accent-primary)] font-mono text-sm ml-1">Tracker</span>
              </span>
              <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 font-mono">
                <span className="font-semibold text-[var(--accent-primary)]">Ур.{playerLevel}</span>
                <span aria-hidden="true">·</span>
                <span>{playerExp}/{maxExp} XP</span>
              </div>
            </div>
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
            Дерево навыков
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

        {/* Zone 3: Actions (Sound, Theme Toggle, Sync) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border text-[var(--text-main)] hover:border-[var(--accent-primary)] transition-colors"
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

          {/* Sync Button */}
          <button
            onClick={onOpenSyncModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-all shadow-sm active:scale-95"
            style={{
              backgroundColor: 'var(--accent-primary)',
            }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="whitespace-nowrap">Синхронизация</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Strip */}
      <div
        className="md:hidden flex items-center justify-around border-t py-1.5 px-2"
        style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}
      >
        <button
          onClick={() => setActiveTab('quests')}
          className={`text-xs px-2 py-1 font-medium ${
            activeTab === 'quests' ? 'text-[var(--accent-primary)] font-bold' : 'text-[var(--text-muted)]'
          }`}
        >
          Квесты
        </button>
        <button
          onClick={() => setActiveTab('skills')}
          className={`text-xs px-2 py-1 font-medium ${
            activeTab === 'skills' ? 'text-[var(--accent-primary)] font-bold' : 'text-[var(--text-muted)]'
          }`}
        >
          Навыки
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`text-xs px-2 py-1 font-medium ${
            activeTab === 'timeline' ? 'text-[var(--accent-primary)] font-bold' : 'text-[var(--text-muted)]'
          }`}
        >
          Таймлайн
        </button>
        <button
          onClick={() => setActiveTab('log')}
          className={`text-xs px-2 py-1 font-medium ${
            activeTab === 'log' ? 'text-[var(--accent-primary)] font-bold' : 'text-[var(--text-muted)]'
          }`}
        >
          Журнал
        </button>
      </div>

      {/* Solid EXP bar strip under topbar */}
      <div className="w-full h-1 bg-black/10 dark:bg-white/10 overflow-hidden relative">
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{
            width: `${expPercent}%`,
            backgroundColor: 'var(--accent-primary)',
          }}
        />
      </div>
    </header>
  );
};
