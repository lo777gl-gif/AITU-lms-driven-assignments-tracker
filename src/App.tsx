import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ThemeId,
  Quest,
  Skill,
  SubQuest,
  UserProfile,
  ActivityLogItem,
  FilterOptions,
  QuestRank,
} from './types';
import { DEFAULT_MOODLE_URL, DEFAULT_ICS_DATA } from './data/defaultCalendar';
import { INITIAL_SKILLS } from './data/defaultSkills';
import { parseMoodleIcs, getQuestStatus } from './utils/icsParser';
import { soundEffects } from './utils/sound';
import { getExpForLevel, QUEST_RANKS, RANK_LIST } from './utils/levelMath';
import { TopBar } from './components/TopBar';
import { PlayerHUD } from './components/PlayerHUD';
import { QuestCard } from './components/QuestCard';
import { SkillsTree } from './components/SkillsTree';
import { ActivityLogView } from './components/ActivityLogView';
import { TimelineView } from './components/TimelineView';
import { SyncModal } from './components/SyncModal';
import { LevelUpModal } from './components/LevelUpModal';
import { CustomQuestModal } from './components/CustomQuestModal';
import { Search, Flame, ArrowUpDown, Sparkles, Link2, RefreshCw } from 'lucide-react';

const STORAGE_KEYS = {
  THEME: 'questlog_theme',
  PROFILE: 'questlog_profile',
  SKILLS: 'questlog_skills',
  QUESTS: 'questlog_quests',
  DELETED_IDS: 'questlog_deleted_ids',
  LOGS: 'questlog_logs',
  LAST_SYNC: 'questlog_last_sync',
  MOODLE_URL: 'questlog_moodle_url',
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'Алексей Студент',
  level: 1,
  exp: 40,
  maxExp: 150,
  totalExpEarned: 40,
  completedQuestsCount: 0,
  soundEnabled: true,
  lastSyncTimestamp: Date.now(),
  streakDays: 4,
  perksUnlocked: [],
};

export default function App() {
  // Theme state: only 'dark' and 'light'
  const [theme, setTheme] = useState<ThemeId>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved === 'dark' || saved === 'light') return saved;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'dark';
  });

  // User's custom Moodle URL
  const [moodleUrl, setMoodleUrl] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.MOODLE_URL) || DEFAULT_MOODLE_URL;
  });

  // User Profile
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  // Skills
  const [skills, setSkills] = useState<Skill[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SKILLS);
      return saved ? JSON.parse(saved) : INITIAL_SKILLS;
    } catch {
      return INITIAL_SKILLS;
    }
  });

  // Track deleted quest IDs
  const [deletedQuestIds, setDeletedQuestIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DELETED_IDS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Quests
  const [quests, setQuests] = useState<Quest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.QUESTS);
      if (saved) return JSON.parse(saved);
      const delSet = new Set<string>();
      return parseMoodleIcs(DEFAULT_ICS_DATA, {}, delSet);
    } catch {
      return parseMoodleIcs(DEFAULT_ICS_DATA);
    }
  });

  // Activity Logs
  const [logs, setLogs] = useState<ActivityLogItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (saved) return JSON.parse(saved);
      return [
        {
          id: 'log-init-1',
          timestamp: Date.now() - 3600000,
          type: 'sync',
          title: 'Инициализация календаря Moodle LMS',
          details: 'Загружено расписание рубежных и практических задач',
          expGained: 0,
        },
      ];
    } catch {
      return [];
    }
  });

  // Navigation Tabs: 'quests' | 'skills' | 'timeline' | 'log'
  const [activeTab, setActiveTab] = useState<'quests' | 'skills' | 'timeline' | 'log'>('quests');

  // Modals state
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isLevelUpModalOpen, setIsLevelUpModalOpen] = useState(false);
  const [isNewQuestModalOpen, setIsNewQuestModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Floating notification toast for gained EXP
  const [expToast, setExpToast] = useState<{ id: number; text: string; exp: number } | null>(null);

  // Quest Filters
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    status: 'all',
    course: 'all',
    skill: 'all',
    difficulty: 'all',
    sortBy: 'deadline_asc',
  });

  // Apply Theme to DOM element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  // Persist moodle URL
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MOODLE_URL, moodleUrl);
  }, [moodleUrl]);

  // Sync sound setting
  useEffect(() => {
    soundEffects.setEnabled(profile.soundEnabled);
  }, [profile.soundEnabled]);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SKILLS, JSON.stringify(skills));
  }, [skills]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.QUESTS, JSON.stringify(quests));
  }, [quests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DELETED_IDS, JSON.stringify(deletedQuestIds));
  }, [deletedQuestIds]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  }, [logs]);

  // Toggle Dark / Light theme
  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Trigger floating EXP banner
  const triggerExpToast = useCallback((amount: number, reason: string) => {
    setExpToast({ id: Date.now(), text: reason, exp: amount });
    setTimeout(() => {
      setExpToast(null);
    }, 1800);
  }, []);

  // Award EXP to player & linked skill
  const awardExp = useCallback((amount: number, reason: string, skillId?: string) => {
    soundEffects.playExpChime();
    triggerExpToast(amount, reason);

    setProfile((prev) => {
      let newExp = prev.exp + amount;
      let newLevel = prev.level;
      let newMaxExp = prev.maxExp;
      let didLevelUp = false;

      while (newExp >= newMaxExp) {
        newExp -= newMaxExp;
        newLevel += 1;
        newMaxExp = getExpForLevel(newLevel);
        didLevelUp = true;
      }

      if (didLevelUp) {
        soundEffects.playLevelUpFanfare();
        setIsLevelUpModalOpen(true);
        setLogs((prevLogs) => [
          {
            id: `log-lvl-${Date.now()}`,
            timestamp: Date.now(),
            type: 'level_up',
            title: `ПОВЫШЕНИЕ УРОВНЯ! Достигнут Уровень ${newLevel}`,
            details: `Следующий уровень требует ${newMaxExp} XP`,
            expGained: 0,
          },
          ...prevLogs,
        ]);
      }

      return {
        ...prev,
        level: newLevel,
        exp: newExp,
        maxExp: newMaxExp,
        totalExpEarned: prev.totalExpEarned + amount,
      };
    });

    if (skillId) {
      setSkills((prevSkills) =>
        prevSkills.map((sk) => {
          if (sk.id !== skillId) return sk;

          let sExp = sk.exp + amount;
          let sLvl = sk.level;
          let sMax = sk.maxExp;

          if (sExp >= sMax) {
            sExp -= sMax;
            sLvl += 1;
            sMax = sLvl * 150;

            setLogs((prevLogs) => [
              {
                id: `log-sk-lvl-${Date.now()}`,
                timestamp: Date.now(),
                type: 'skill_level_up',
                title: `Прокачка навыка: ${sk.name} повышен до Ур.${sLvl}!`,
                expGained: 0,
                skillId: sk.id,
                skillName: sk.name,
              },
              ...prevLogs,
            ]);
          }

          return { ...sk, exp: sExp, level: sLvl, maxExp: sMax };
        })
      );
    }
  }, [triggerExpToast]);

  // Complete a quest
  const handleCompleteQuest = useCallback((questId: string) => {
    soundEffects.playQuestComplete();

    setQuests((prev) =>
      prev.map((q) => {
        if (q.id !== questId) return q;

        awardExp(q.baseExp, `Квест выполнен: ${q.cleanTitle}`, q.linkedSkillId);

        const updatedSubs = q.subquests.map((s) => ({ ...s, isCompleted: true }));

        setLogs((prevLogs) => [
          {
            id: `log-q-${Date.now()}`,
            timestamp: Date.now(),
            type: 'quest_complete',
            title: `Завершен квест: ${q.cleanTitle}`,
            details: `Курс: ${q.courseName} (Ранг ${q.difficulty})`,
            expGained: q.baseExp,
            skillId: q.linkedSkillId,
          },
          ...prevLogs,
        ]);

        return {
          ...q,
          isCompleted: true,
          completedAt: new Date().toISOString(),
          subquests: updatedSubs,
        };
      })
    );
  }, [awardExp]);

  // Uncomplete a quest
  const handleUncompleteQuest = useCallback((questId: string) => {
    setQuests((prev) =>
      prev.map((q) => (q.id === questId ? { ...q, isCompleted: false, completedAt: undefined } : q))
    );
  }, []);

  // Delete a quest
  const handleDeleteQuest = useCallback((questId: string) => {
    setQuests((prev) => {
      const target = prev.find((q) => q.id === questId);
      if (target) {
        setLogs((prevLogs) => [
          {
            id: `log-del-${Date.now()}`,
            timestamp: Date.now(),
            type: 'quest_delete',
            title: `Удалено задание: ${target.cleanTitle}`,
            details: `Курс: ${target.courseName}`,
            expGained: 0,
          },
          ...prevLogs,
        ]);
      }
      return prev.filter((q) => q.id !== questId);
    });

    setDeletedQuestIds((prev) => (prev.includes(questId) ? prev : [...prev, questId]));
  }, []);

  // Change quest difficulty rank (S, A, B, C, D, E, F)
  const handleChangeQuestDifficulty = useCallback((questId: string, rank: QuestRank) => {
    const newBaseExp = QUEST_RANKS[rank].exp;
    setQuests((prev) =>
      prev.map((q) => (q.id === questId ? { ...q, difficulty: rank, baseExp: newBaseExp } : q))
    );
  }, []);

  // Toggle subquest checkbox
  const handleToggleSubquest = useCallback((questId: string, subquestId: string) => {
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id !== questId) return q;

        const updatedSubs = q.subquests.map((sq) => {
          if (sq.id !== subquestId) return sq;
          const nextState = !sq.isCompleted;

          if (nextState) {
            soundEffects.playSubquestCheck();
            awardExp(sq.exp, `Шаг квеста: ${sq.text}`, q.linkedSkillId);

            setLogs((prevLogs) => [
              {
                id: `log-sq-${Date.now()}`,
                timestamp: Date.now(),
                type: 'subquest_complete',
                title: `Выполнен шаг: ${sq.text}`,
                details: `В квесте: ${q.cleanTitle}`,
                expGained: sq.exp,
                skillId: q.linkedSkillId,
              },
              ...prevLogs,
            ]);
          }

          return { ...sq, isCompleted: nextState };
        });

        return { ...q, subquests: updatedSubs };
      })
    );
  }, [awardExp]);

  // Add subquest
  const handleAddSubquest = useCallback((questId: string, text: string) => {
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id !== questId) return q;
        const newSub: SubQuest = {
          id: `${questId}-sub-${Date.now()}`,
          text,
          isCompleted: false,
          exp: 20,
        };
        return { ...q, subquests: [...q.subquests, newSub] };
      })
    );
  }, []);

  // Delete subquest
  const handleDeleteSubquest = useCallback((questId: string, subquestId: string) => {
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id !== questId) return q;
        return { ...q, subquests: q.subquests.filter((s) => s.id !== subquestId) };
      })
    );
  }, []);

  // Change linked skill for a quest
  const handleChangeLinkedSkill = useCallback((questId: string, skillId: string) => {
    setQuests((prev) =>
      prev.map((q) => (q.id === questId ? { ...q, linkedSkillId: skillId } : q))
    );
  }, []);

  // Add user-created custom skill
  const handleAddSkill = useCallback((newSkillData: Omit<Skill, 'id' | 'level' | 'exp' | 'maxExp'>) => {
    const newSkill: Skill = {
      ...newSkillData,
      id: `skill-${Date.now()}`,
      level: 1,
      exp: 0,
      maxExp: 150,
    };
    setSkills((prev) => [...prev, newSkill]);
    setLogs((prev) => [
      {
        id: `log-sk-create-${Date.now()}`,
        timestamp: Date.now(),
        type: 'sync',
        title: `Создан новый навык: ${newSkill.name}`,
        expGained: 0,
      },
      ...prev,
    ]);
  }, []);

  // Add user-created custom quest
  const handleCreateCustomQuest = useCallback((newQuest: Quest) => {
    setQuests((prev) => [newQuest, ...prev]);
    setLogs((prev) => [
      {
        id: `log-q-create-${Date.now()}`,
        timestamp: Date.now(),
        type: 'quest_create',
        title: `Создан новый квест: ${newQuest.cleanTitle}`,
        details: `Дедлайн: ${newQuest.localDeadline}`,
        expGained: 0,
      },
      ...prev,
    ]);
  }, []);

  // Synchronize from URL using multi-proxy cascade
  const handleSyncFromUrl = async (url: string): Promise<{ success: boolean; count: number; error?: string }> => {
    setIsSyncing(true);

    const existingMap: Record<string, Quest> = {};
    quests.forEach((q) => {
      existingMap[q.id] = q;
    });

    const deletedSet = new Set<string>(deletedQuestIds);

    const proxyUrls = [
      `/api/calendar-proxy?url=${encodeURIComponent(url)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
    ];

    let icsText = '';
    let lastError = '';

    for (const pUrl of proxyUrls) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(pUrl, { signal: controller.signal });
        clearTimeout(timeout);

        if (res.ok) {
          const text = await res.text();
          if (text.includes('BEGIN:VCALENDAR')) {
            icsText = text;
            break;
          }
        }
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : 'Timeout';
      }
    }

    setIsSyncing(false);

    if (!icsText) {
      return {
        success: false,
        count: 0,
        error: `Не удалось загрузить календарь (${lastError || 'сервер недоступен'}). Проверьте ссылку или загрузите файл .ics напрямую.`,
      };
    }

    const parsed = parseMoodleIcs(icsText, existingMap, deletedSet);
    setQuests(parsed);
    setProfile((prev) => ({ ...prev, lastSyncTimestamp: Date.now() }));

    setLogs((prev) => [
      {
        id: `log-sync-${Date.now()}`,
        timestamp: Date.now(),
        type: 'sync',
        title: `Синхронизация с Moodle LMS завершена`,
        details: `Актуализировано ${parsed.length} академических заданий`,
        expGained: 0,
      },
      ...prev,
    ]);

    return { success: true, count: parsed.length };
  };

  // Import raw text / dropped file
  const handleImportIcsText = (text: string): { success: boolean; count: number; error?: string } => {
    if (!text.includes('BEGIN:VCALENDAR')) {
      return { success: false, count: 0, error: 'Текст не является валидным файлом iCalendar (нет BEGIN:VCALENDAR)' };
    }

    const existingMap: Record<string, Quest> = {};
    quests.forEach((q) => {
      existingMap[q.id] = q;
    });

    const deletedSet = new Set<string>(deletedQuestIds);
    const parsed = parseMoodleIcs(text, existingMap, deletedSet);
    setQuests(parsed);
    setProfile((prev) => ({ ...prev, lastSyncTimestamp: Date.now() }));

    setLogs((prev) => [
      {
        id: `log-import-${Date.now()}`,
        timestamp: Date.now(),
        type: 'sync',
        title: 'Импорт файла расписания Moodle',
        details: `Импортировано ${parsed.length} заданий`,
        expGained: 0,
      },
      ...prev,
    ]);

    return { success: true, count: parsed.length };
  };

  // Reset to default authentic sample calendar
  const handleResetToDefault = () => {
    setDeletedQuestIds([]);
    setMoodleUrl(DEFAULT_MOODLE_URL);
    const parsed = parseMoodleIcs(DEFAULT_ICS_DATA, {}, new Set());
    setQuests(parsed);
    setProfile((prev) => ({ ...prev, lastSyncTimestamp: Date.now() }));
  };

  // Extract unique course list
  const uniqueCourses = useMemo(() => {
    const set = new Set<string>();
    quests.forEach((q) => {
      if (q.courseName) set.add(q.courseName);
    });
    return Array.from(set);
  }, [quests]);

  // Filtered and sorted quests
  const filteredQuests = useMemo(() => {
    return quests
      .filter((q) => {
        if (filters.searchQuery) {
          const qText = `${q.cleanTitle} ${q.description} ${q.courseName} ${q.instructor}`.toLowerCase();
          if (!qText.includes(filters.searchQuery.toLowerCase())) return false;
        }

        const status = getQuestStatus(q);
        if (filters.status === 'active' && (status === 'completed' || status === 'failed')) return false;
        if (filters.status === 'burning' && status !== 'burning') return false;
        if (filters.status === 'completed' && status !== 'completed') return false;
        if (filters.status === 'failed' && status !== 'failed') return false;

        if (filters.course !== 'all' && q.courseName !== filters.course) return false;
        if (filters.skill !== 'all' && q.linkedSkillId !== filters.skill) return false;
        if (filters.difficulty !== 'all' && q.difficulty !== filters.difficulty) return false;

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'deadline_asc') return a.deadlineTimestamp - b.deadlineTimestamp;
        if (filters.sortBy === 'deadline_desc') return b.deadlineTimestamp - a.deadlineTimestamp;
        if (filters.sortBy === 'exp_desc') return b.baseExp - a.baseExp;
        if (filters.sortBy === 'title') return a.cleanTitle.localeCompare(b.cleanTitle);
        return 0;
      });
  }, [quests, filters]);

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-200">
      {/* Top Bar with 2 themes */}
      <TopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentTheme={theme}
        onToggleTheme={handleToggleTheme}
        isSyncing={isSyncing}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        soundEnabled={profile.soundEnabled}
        onToggleSound={() => setProfile((p) => ({ ...p, soundEnabled: !p.soundEnabled }))}
        playerLevel={profile.level}
        playerExp={profile.exp}
        maxExp={profile.maxExp}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <PlayerHUD
          profile={profile}
          quests={quests}
          onUpdateProfile={(updated) => setProfile((prev) => ({ ...prev, ...updated }))}
          onOpenNewQuestModal={() => setIsNewQuestModalOpen(true)}
        />

        {/* Tab 1: Quests List */}
        {activeTab === 'quests' && (
          <div className="space-y-6">
            {/* Quick Moodle Link Status Bar */}
            <div
              className="rounded-2xl border p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-sm"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-sm"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  <Link2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[var(--text-main)] flex items-center gap-2">
                    <span>Подключение Moodle:</span>
                    {moodleUrl !== DEFAULT_MOODLE_URL ? (
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        Ваша персональная ссылка
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                        Демо-календарь AITU
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] truncate max-w-xs sm:max-w-lg font-mono mt-0.5">
                    {moodleUrl}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setIsSyncModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Вставить свою ссылку / Обновить</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div
              className="rounded-2xl border p-4 sm:p-5 shadow-sm transition-all"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Поиск по названию, курсу или преподавателю..."
                    value={filters.searchQuery}
                    onChange={(e) => setFilters((f) => ({ ...f, searchQuery: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border bg-transparent text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  />
                  {filters.searchQuery && (
                    <button
                      onClick={() => setFilters((f) => ({ ...f, searchQuery: '' }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    >
                      Очистить
                    </button>
                  )}
                </div>

                {/* Status Segmented Buttons */}
                <div
                  className="flex items-center gap-1 p-1 rounded-xl border overflow-x-auto shrink-0"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    backgroundColor: 'var(--bg-surface-hover)',
                  }}
                >
                  <button
                    onClick={() => setFilters((f) => ({ ...f, status: 'all' }))}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                      filters.status === 'all'
                        ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    Все ({quests.length})
                  </button>

                  <button
                    onClick={() => setFilters((f) => ({ ...f, status: 'active' }))}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                      filters.status === 'active'
                        ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    В работе
                  </button>

                  <button
                    onClick={() => setFilters((f) => ({ ...f, status: 'burning' }))}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-1 ${
                      filters.status === 'burning'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'text-amber-500 hover:text-amber-400'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Горят 🔥</span>
                  </button>

                  <button
                    onClick={() => setFilters((f) => ({ ...f, status: 'completed' }))}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                      filters.status === 'completed'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-emerald-500 hover:text-emerald-400'
                    }`}
                  >
                    Сдано
                  </button>

                  <button
                    onClick={() => setFilters((f) => ({ ...f, status: 'failed' }))}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                      filters.status === 'failed'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-red-500 hover:text-red-400'
                    }`}
                  >
                    Просрочено
                  </button>
                </div>
              </div>

              {/* Secondary filter row */}
              <div
                className="mt-3.5 pt-3 border-t flex flex-wrap items-center justify-between gap-3 text-xs"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[var(--text-muted)] font-medium">Курс:</span>
                  <select
                    value={filters.course}
                    onChange={(e) => setFilters((f) => ({ ...f, course: e.target.value }))}
                    className="px-2.5 py-1 rounded-lg border max-w-[190px] truncate focus:outline-none"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <option value="all">Все дисциплины</option>
                    {uniqueCourses.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <span className="text-[var(--text-muted)] font-medium ml-2">Навык:</span>
                  <select
                    value={filters.skill}
                    onChange={(e) => setFilters((f) => ({ ...f, skill: e.target.value }))}
                    className="px-2.5 py-1 rounded-lg border max-w-[190px] truncate focus:outline-none"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <option value="all">Все навыки</option>
                    {skills.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>

                  <span className="text-[var(--text-muted)] font-medium ml-2">Сложность:</span>
                  <select
                    value={filters.difficulty}
                    onChange={(e) => setFilters((f) => ({ ...f, difficulty: e.target.value as any }))}
                    className="px-2.5 py-1 rounded-lg border focus:outline-none font-mono"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <option value="all">Все ранги (S-F)</option>
                    {RANK_LIST.map((r) => (
                      <option key={r} value={r}>
                        Ранг {r} (+{QUEST_RANKS[r].exp} XP)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span className="text-[var(--text-muted)] font-medium">Сортировка:</span>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value as any }))}
                    className="px-2.5 py-1 rounded-lg border focus:outline-none"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <option value="deadline_asc">Сначала ближайшие дедлайны</option>
                    <option value="deadline_desc">Сначала поздние дедлайны</option>
                    <option value="exp_desc">По награде (максимум XP)</option>
                    <option value="title">По названию (А-Я)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Quests Grid */}
            {filteredQuests.length === 0 ? (
              <div
                className="rounded-2xl border p-12 text-center"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              >
                <Sparkles className="w-12 h-12 mx-auto text-[var(--accent-primary)] opacity-40 mb-3" />
                <h3 className="font-bold text-base text-[var(--text-main)]">Задания не найдены</h3>
                <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto mt-1">
                  Сбросьте фильтры поиска или синхронизируйте расписание со своим Moodle LMS.
                </p>
                <button
                  onClick={() =>
                    setFilters({
                      searchQuery: '',
                      status: 'all',
                      course: 'all',
                      skill: 'all',
                      difficulty: 'all',
                      sortBy: 'deadline_asc',
                    })
                  }
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  Сбросить фильтры
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {filteredQuests.map((quest) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    skills={skills}
                    onCompleteQuest={handleCompleteQuest}
                    onUncompleteQuest={handleUncompleteQuest}
                    onToggleSubquest={handleToggleSubquest}
                    onAddSubquest={handleAddSubquest}
                    onDeleteSubquest={handleDeleteSubquest}
                    onChangeLinkedSkill={handleChangeLinkedSkill}
                    onChangeDifficulty={handleChangeQuestDifficulty}
                    onDeleteQuest={handleDeleteQuest}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Skills Tree */}
        {activeTab === 'skills' && (
          <SkillsTree skills={skills} quests={quests} onAddSkill={handleAddSkill} />
        )}

        {/* Tab 3: Timeline */}
        {activeTab === 'timeline' && (
          <TimelineView
            quests={quests}
            skills={skills}
            onSelectQuest={(id) => {
              setActiveTab('quests');
              setFilters((f) => ({ ...f, searchQuery: id }));
            }}
          />
        )}

        {/* Tab 4: Activity Log */}
        {activeTab === 'log' && (
          <ActivityLogView logs={logs} onClearLogs={() => setLogs([])} />
        )}
      </main>

      {/* Floating EXP Banner Toast (Solid Emerald) */}
      {expToast && (
        <div className="fixed bottom-6 right-6 z-50 exp-float-anim pointer-events-none">
          <div
            className="px-4 py-2 rounded-xl border text-sm font-bold shadow-lg flex items-center gap-2 text-white"
            style={{
              backgroundColor: '#10b981',
              borderColor: '#059669',
            }}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>+{expToast.exp} XP!</span>
            <span className="text-xs font-normal opacity-90 truncate max-w-[200px]">
              {expToast.text}
            </span>
          </div>
        </div>
      )}

      {/* Modals */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        savedUrl={moodleUrl}
        onSaveUrl={(url) => setMoodleUrl(url)}
        onSyncFromUrl={handleSyncFromUrl}
        onImportIcsText={handleImportIcsText}
        onResetToDefault={handleResetToDefault}
        lastSyncTimestamp={profile.lastSyncTimestamp}
      />

      <LevelUpModal
        isOpen={isLevelUpModalOpen}
        level={profile.level}
        onClose={() => setIsLevelUpModalOpen(false)}
        unlockedPerks={profile.perksUnlocked}
        onSelectPerk={(perkId) => {
          setProfile((p) => ({ ...p, perksUnlocked: [...p.perksUnlocked, perkId] }));
        }}
      />

      <CustomQuestModal
        isOpen={isNewQuestModalOpen}
        onClose={() => setIsNewQuestModalOpen(false)}
        skills={skills}
        onCreateQuest={handleCreateCustomQuest}
      />
    </div>
  );
}
