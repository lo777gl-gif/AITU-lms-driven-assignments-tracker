import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ThemeId,
  Quest,
  Skill,
  UserProfile,
  ActivityLogItem,
  FilterOptions,
  QuestRank,
  UserAccount,
  PenaltyRule,
} from './types';
import { DEFAULT_MOODLE_URL, DEFAULT_ICS_DATA, getInitialQuests } from './data/defaultCalendar';
import { INITIAL_SKILLS } from './data/defaultSkills';
import { parseMoodleIcs, mergeQuestsWithLms, getQuestStatus, formatToAstanaTime } from './utils/icsParser';
import { soundEffects } from './utils/sound';
import {
  QUEST_RANKS,
  RANK_LIST,
  getNextRecurringDeadline,
  isTaskScheduledForToday,
  getRecurrenceDescription,
  getAstanaDateString,
  getQuestPenaltyPoints,
  DEFAULT_PENALTY_RULES,
  getRankPointsForTarget,
} from './utils/levelMath';
import { TopBar } from './components/TopBar';
import { PlayerHUD } from './components/PlayerHUD';
import { QuestCard } from './components/QuestCard';
import { SkillsTree } from './components/SkillsTree';
import { ActivityLogView } from './components/ActivityLogView';
import { TimelineView } from './components/TimelineView';
import { SyncModal } from './components/SyncModal';
import { CustomQuestModal } from './components/CustomQuestModal';
import { EditQuestModal } from './components/EditQuestModal';
import { SpendPointsModal } from './components/SpendPointsModal';
import { AccountModal } from './components/AccountModal';
import { ResetProgressModal } from './components/ResetProgressModal';
import { PenaltyModal } from './components/PenaltyModal';
import {
  Search,
  Flame,
  ArrowUpDown,
  Sparkles,
  Link2,
  RefreshCw,
  Coins,
  Calendar,
  CheckCircle2,
  Sun,
  Moon,
  Clock,
  Circle,
} from 'lucide-react';

const STORAGE_KEYS = {
  THEME: 'questlog_theme',
  ACCOUNTS_LIST: 'questlog_accounts_v1',
  ACTIVE_USER: 'questlog_active_user_v1',
  AUTH_TOKEN: 'questlog_auth_token_v1',
};

const getAccountStorageKey = (username: string, key: string) => {
  const safeUser = (username || 'student').trim().toLowerCase();
  return `questlog_u_${safeUser}_${key}`;
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'Студент',
  points: 120,
  totalPointsEarned: 120,
  totalPointsSpent: 0,
  totalPenalties: 0,
  completedQuestsCount: 0,
  soundEnabled: true,
  lastSyncTimestamp: Date.now(),
  streakDays: 1,
  weeklyTargetPoints: 200,
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

  // Account System: Current active nickname
  const [currentUsername, setCurrentUsername] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_USER) || 'Студент';
  });

  // Account System: List of accounts registered on this device
  const [accounts, setAccounts] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTS_LIST);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return [{ username: 'Студент', createdAt: Date.now(), lastLoginAt: Date.now() }];
    } catch {
      return [{ username: 'Студент', createdAt: Date.now(), lastLoginAt: Date.now() }];
    }
  });

  // User's Moodle URL (per account)
  const [moodleUrl, setMoodleUrl] = useState<string>(() => {
    const active = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER) || 'Студент';
    return localStorage.getItem(getAccountStorageKey(active, 'moodle_url')) || DEFAULT_MOODLE_URL;
  });

  // User Profile with Points System (per account)
  const [profile, setProfile] = useState<UserProfile>(() => {
    const active = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER) || 'Студент';
    try {
      const saved = localStorage.getItem(getAccountStorageKey(active, 'profile'));
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          name: parsed.name || active,
          points: parsed.points !== undefined ? parsed.points : 120,
          totalPointsEarned: parsed.totalPointsEarned !== undefined ? parsed.totalPointsEarned : 120,
          totalPointsSpent: parsed.totalPointsSpent || 0,
          totalPenalties: parsed.totalPenalties || 0,
          completedQuestsCount: parsed.completedQuestsCount || 0,
          soundEnabled: parsed.soundEnabled !== undefined ? parsed.soundEnabled : true,
          lastSyncTimestamp: parsed.lastSyncTimestamp || Date.now(),
          streakDays: parsed.streakDays || 1,
          weeklyTargetPoints: parsed.weeklyTargetPoints || 200,
        };
      }
      return { ...DEFAULT_PROFILE, name: active };
    } catch {
      return { ...DEFAULT_PROFILE, name: active };
    }
  });

  // Skills (per account)
  const [skills, setSkills] = useState<Skill[]>(() => {
    const active = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER) || 'Студент';
    try {
      const saved = localStorage.getItem(getAccountStorageKey(active, 'skills'));
      return saved ? JSON.parse(saved) : INITIAL_SKILLS;
    } catch {
      return INITIAL_SKILLS;
    }
  });

  // Track deleted quest IDs (per account)
  const [deletedQuestIds, setDeletedQuestIds] = useState<string[]>(() => {
    const active = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER) || 'Студент';
    try {
      const saved = localStorage.getItem(getAccountStorageKey(active, 'deleted_ids'));
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Quests (initialized with balanced habits & university tasks per account)
  const [quests, setQuests] = useState<Quest[]>(() => {
    const active = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER) || 'Студент';
    try {
      const saved = localStorage.getItem(getAccountStorageKey(active, 'quests'));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return getInitialQuests();
    } catch {
      return getInitialQuests();
    }
  });

  // Activity Logs (per account)
  const [logs, setLogs] = useState<ActivityLogItem[]>(() => {
    const active = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER) || 'Студент';
    try {
      const saved = localStorage.getItem(getAccountStorageKey(active, 'logs'));
      if (saved) return JSON.parse(saved);
      return [
        {
          id: 'log-init-1',
          timestamp: Date.now() - 3600000,
          type: 'sync',
          title: 'Инициализация расписания и балловой системы',
          details: 'Баланс: до 200 баллов в неделю (сон, спорт, университет)',
          pointsChange: 0,
        },
      ];
    } catch {
      return [];
    }
  });

  // Navigation Tabs: 'quests' | 'skills' | 'timeline' | 'log'
  const [activeTab, setActiveTab] = useState<'quests' | 'skills' | 'timeline' | 'log'>('quests');

  // Configurable Penalties (per account)
  const [penalties, setPenalties] = useState<PenaltyRule[]>(() => {
    const active = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER) || 'Студент';
    try {
      const saved = localStorage.getItem(getAccountStorageKey(active, 'penalties'));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_PENALTY_RULES;
    } catch {
      return DEFAULT_PENALTY_RULES;
    }
  });

  // Modals state
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncModalInitialTab, setSyncModalInitialTab] = useState<'balance' | 'url' | 'file' | 'paste'>('balance');
  const [isNewQuestModalOpen, setIsNewQuestModalOpen] = useState(false);
  const [isSpendModalOpen, setIsSpendModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isResetProgressModalOpen, setIsResetProgressModalOpen] = useState(false);
  const [isPenaltyModalOpen, setIsPenaltyModalOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Floating notification toast for Points change (+/-)
  const [pointsToast, setPointsToast] = useState<{ id: number; text: string; points: number; isDeduction?: boolean } | null>(null);

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

  // Persist Active Account and Accounts List
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, currentUsername);
  }, [currentUsername]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS_LIST, JSON.stringify(accounts));
  }, [accounts]);

  // Persist current account data to namespaced keys
  useEffect(() => {
    localStorage.setItem(getAccountStorageKey(currentUsername, 'moodle_url'), moodleUrl);
  }, [currentUsername, moodleUrl]);

  // Sync sound setting
  useEffect(() => {
    soundEffects.setEnabled(profile.soundEnabled);
  }, [profile.soundEnabled]);

  // Save changes to localStorage under current account key
  useEffect(() => {
    localStorage.setItem(getAccountStorageKey(currentUsername, 'profile'), JSON.stringify(profile));
  }, [currentUsername, profile]);

  useEffect(() => {
    localStorage.setItem(getAccountStorageKey(currentUsername, 'skills'), JSON.stringify(skills));
  }, [currentUsername, skills]);

  useEffect(() => {
    localStorage.setItem(getAccountStorageKey(currentUsername, 'quests'), JSON.stringify(quests));
  }, [currentUsername, quests]);

  useEffect(() => {
    localStorage.setItem(getAccountStorageKey(currentUsername, 'deleted_ids'), JSON.stringify(deletedQuestIds));
  }, [currentUsername, deletedQuestIds]);

  useEffect(() => {
    localStorage.setItem(getAccountStorageKey(currentUsername, 'logs'), JSON.stringify(logs));
  }, [currentUsername, logs]);

  useEffect(() => {
    localStorage.setItem(getAccountStorageKey(currentUsername, 'penalties'), JSON.stringify(penalties));
  }, [currentUsername, penalties]);

  // Toggle Dark / Light theme
  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Trigger floating Points banner
  const triggerPointsToast = useCallback((amount: number, reason: string, isDeduction = false) => {
    setPointsToast({ id: Date.now(), text: reason, points: amount, isDeduction });
    setTimeout(() => {
      setPointsToast(null);
    }, 2200);
  }, []);

  // Award points to player & linked skill
  const awardPoints = useCallback((amount: number, reason: string, skillId?: string) => {
    soundEffects.playExpChime();
    triggerPointsToast(amount, reason, false);

    setProfile((prev) => ({
      ...prev,
      points: prev.points + amount,
      totalPointsEarned: prev.totalPointsEarned + amount,
    }));

    if (skillId) {
      setSkills((prevSkills) =>
        prevSkills.map((sk) => {
          if (sk.id !== skillId) return sk;
          return { ...sk, points: (sk.points || 0) + amount };
        })
      );
    }
  }, [triggerPointsToast]);

  // Spend points on rewards
  const handleSpendPoints = useCallback((amount: number, reason: string): boolean => {
    if (profile.points < amount) {
      return false;
    }

    soundEffects.playSpendChime();
    triggerPointsToast(amount, `Списание: ${reason}`, true);

    setProfile((prev) => ({
      ...prev,
      points: prev.points - amount,
      totalPointsSpent: prev.totalPointsSpent + amount,
    }));

    setLogs((prevLogs) => [
      {
        id: `log-spend-${Date.now()}`,
        timestamp: Date.now(),
        type: 'points_spend',
        title: `Списание баллов: ${reason}`,
        details: `Списано: ${amount} б. Оставшийся баланс: ${profile.points - amount} б.`,
        pointsChange: -amount,
      },
      ...prevLogs,
    ]);

    return true;
  }, [profile.points, triggerPointsToast]);

  // Complete a quest (handles recurring tasks by advancing the deadline)
  const handleCompleteQuest = useCallback((questId: string) => {
    soundEffects.playQuestComplete();

    setQuests((prev) =>
      prev.map((q) => {
        if (q.id !== questId) return q;

        const pointsToAward = q.points || QUEST_RANKS[q.difficulty]?.points || 5;

        // If it's a recurring task:
        if (q.isRecurring) {
          const todayDateStr = getAstanaDateString(Date.now());
          const nextTimestamp = getNextRecurringDeadline(
            q.deadlineTimestamp,
            q.recurrenceType || 'daily',
            q.recurrenceDays || 1,
            q.recurrenceWeekdays || [1, 2, 3, 4, 5],
            q.recurrenceTime || '23:00'
          );
          const nextLocalDeadline = formatToAstanaTime(nextTimestamp);

          awardPoints(pointsToAward, `Выполнено: ${q.cleanTitle}`, q.linkedSkillId);

          setLogs((prevLogs) => [
            {
              id: `log-q-rec-${Date.now()}`,
              timestamp: Date.now(),
              type: 'quest_complete',
              title: `Выполнен цикл: ${q.cleanTitle}`,
              details: `Следующий срок: ${nextLocalDeadline}. Начислено: +${pointsToAward} б.`,
              pointsChange: pointsToAward,
              skillId: q.linkedSkillId,
            },
            ...prevLogs,
          ]);

          return {
            ...q,
            isCompleted: true, // Remains completed for today! Will NOT reappear today
            lastCompletedDate: todayDateStr,
            completedAt: new Date().toISOString(),
            completedCount: (q.completedCount || 0) + 1,
            nextScheduledDate: nextTimestamp,
          };
        }

        // Standard non-recurring quest
        awardPoints(pointsToAward, `Квест выполнен: ${q.cleanTitle}`, q.linkedSkillId);

        setLogs((prevLogs) => [
          {
            id: `log-q-${Date.now()}`,
            timestamp: Date.now(),
            type: 'quest_complete',
            title: `Завершен квест: ${q.cleanTitle}`,
            details: `Курс: ${q.courseName} (+${pointsToAward} б.)`,
            pointsChange: pointsToAward,
            skillId: q.linkedSkillId,
          },
          ...prevLogs,
        ]);

        setProfile((p) => ({ ...p, completedQuestsCount: p.completedQuestsCount + 1 }));

        return {
          ...q,
          isCompleted: true,
          completedAt: new Date().toISOString(),
        };
      })
    );
  }, [awardPoints]);

  // Uncomplete a quest (deducts points and updates profile and skills)
  const handleUncompleteQuest = useCallback((questId: string) => {
    let deductedPoints = 0;
    let targetSkillId = '';
    let questTitle = '';

    setQuests((prev) =>
      prev.map((q) => {
        if (q.id !== questId) return q;
        if (!q.isCompleted) return q;

        deductedPoints = q.points || QUEST_RANKS[q.difficulty]?.points || 5;
        targetSkillId = q.linkedSkillId;
        questTitle = q.cleanTitle;

        return {
          ...q,
          isCompleted: false,
          completedAt: undefined,
          lastCompletedDate: undefined,
          nextScheduledDate: undefined,
          completedCount: Math.max(0, (q.completedCount || 1) - 1),
        };
      })
    );

    if (deductedPoints > 0) {
      soundEffects.playSpendChime();
      triggerPointsToast(deductedPoints, `Отмена выполнения: ${questTitle}`, true);

      setProfile((prev) => ({
        ...prev,
        points: Math.max(0, prev.points - deductedPoints),
        totalPointsEarned: Math.max(0, prev.totalPointsEarned - deductedPoints),
        completedQuestsCount: Math.max(0, prev.completedQuestsCount - 1),
      }));

      if (targetSkillId) {
        setSkills((prevSkills) =>
          prevSkills.map((sk) => {
            if (sk.id !== targetSkillId) return sk;
            return { ...sk, points: Math.max(0, (sk.points || 0) - deductedPoints) };
          })
        );
      }

      setLogs((prev) => [
        {
          id: `log-uncomp-${Date.now()}`,
          timestamp: Date.now(),
          type: 'quest_uncomplete',
          title: `Снята отметка: ${questTitle}`,
          details: `Снято -${deductedPoints} б. с баланса`,
          pointsChange: -deductedPoints,
          skillId: targetSkillId,
        },
        ...prev,
      ]);
    }
  }, [triggerPointsToast]);

  // Apply disciplinary penalty (-10, -5, -20, or custom)
  const handleApplyPenalty = useCallback((penaltyPoints: number, reason: string, questId?: string) => {
    soundEffects.playPenaltySound();
    triggerPointsToast(penaltyPoints, `Штраф: ${reason}`, true);

    setProfile((prev) => ({
      ...prev,
      points: Math.max(0, prev.points - penaltyPoints),
      totalPenalties: (prev.totalPenalties || 0) + penaltyPoints,
    }));

    setLogs((prev) => [
      {
        id: `log-penalty-${Date.now()}`,
        timestamp: Date.now(),
        type: 'penalty',
        title: `Штраф: ${reason}`,
        details: `Списано -${penaltyPoints} б. за нарушение дисциплины`,
        pointsChange: -penaltyPoints,
      },
      ...prev,
    ]);

    if (questId) {
      setQuests((prev) =>
        prev.map((q) => (q.id === questId ? { ...q, isPenalized: true } : q))
      );
    }
  }, [triggerPointsToast]);

  // Direct penalty from quest card
  const handleQuestPenalty = useCallback((quest: Quest) => {
    const penaltyPoints = getQuestPenaltyPoints(quest);
    handleApplyPenalty(penaltyPoints, `${quest.cleanTitle} (просрочено)`, quest.id);
  }, [handleApplyPenalty]);

  // Reset all points and skill progress to 0
  const handleResetProgress = useCallback(() => {
    soundEffects.playSpendChime();

    setProfile((prev) => ({
      ...prev,
      points: 0,
      totalPointsEarned: 0,
      totalPointsSpent: 0,
      totalPenalties: 0,
      completedQuestsCount: 0,
    }));

    setSkills((prev) =>
      prev.map((s) => ({
        ...s,
        points: 0,
      }))
    );

    setLogs((prev) => [
      {
        id: `log-reset-${Date.now()}`,
        timestamp: Date.now(),
        type: 'reset_progress',
        title: 'Полное обнуление прогресса',
        details: 'Все баллы и прокачка навыков сброшены до 0',
        pointsChange: 0,
      },
      ...prev,
    ]);

    triggerPointsToast(0, 'Прогресс полностью обнулен', false);
  }, [triggerPointsToast]);

  // Mark quest as failed (deducts penalty and advances cycle for recurring, sinks to bottom for regular)
  const handleFailQuest = useCallback(
    (questId: string) => {
      const now = Date.now();
      const todayDateStr = getAstanaDateString(now);

      const target = quests.find((q) => q.id === questId);
      if (!target) return;

      if (target.isRecurring) {
        const penaltyPoints = getQuestPenaltyPoints(target);
        soundEffects.playPenaltySound();
        triggerPointsToast(penaltyPoints, `Штраф: ${target.cleanTitle} не выполнено`, true);

        const nextTimestamp = getNextRecurringDeadline(
          now,
          target.recurrenceType || 'daily',
          target.recurrenceDays || 1,
          target.recurrenceWeekdays || [1, 2, 3, 4, 5],
          target.recurrenceTime || '23:00'
        );

        setProfile((prev) => ({
          ...prev,
          points: Math.max(0, prev.points - penaltyPoints),
          totalPenalties: (prev.totalPenalties || 0) + penaltyPoints,
        }));

        setQuests((prev) =>
          prev.map((q) => {
            if (q.id !== questId) return q;
            return {
              ...q,
              isCompleted: false,
              isFailed: true,
              failedAt: new Date().toISOString(),
              failedCount: (q.failedCount || 0) + 1,
              lastCompletedDate: todayDateStr,
              nextScheduledDate: nextTimestamp,
            };
          })
        );

        setLogs((prevLogs) => [
          {
            id: `log-fail-rec-${Date.now()}`,
            timestamp: Date.now(),
            type: 'penalty',
            title: `Не выполнено (штраф): ${target.cleanTitle}`,
            details: `Списано -${penaltyPoints} б. Цикл обновлен до следующего расписания (${formatToAstanaTime(nextTimestamp)}).`,
            pointsChange: -penaltyPoints,
          },
          ...prevLogs,
        ]);
      } else {
        // Standard regular quest: mark failed and sink to bottom
        soundEffects.playPenaltySound();
        triggerPointsToast(0, `Задание «${target.cleanTitle}» помечено как невыполненное`, true);

        setQuests((prev) =>
          prev.map((q) => {
            if (q.id !== questId) return q;
            return {
              ...q,
              isFailed: true,
              failedAt: new Date().toISOString(),
            };
          })
        );

        setLogs((prevLogs) => [
          {
            id: `log-fail-${Date.now()}`,
            timestamp: Date.now(),
            type: 'quest_fail',
            title: `Не выполнено: ${target.cleanTitle}`,
            details: `Задание помечено как невыполненное и перемещено вниз списка`,
            pointsChange: 0,
          },
          ...prevLogs,
        ]);
      }
    },
    [quests, triggerPointsToast]
  );

  // Undo fail state / restore quest to active work
  const handleUnfailQuest = useCallback(
    (questId: string) => {
      setQuests((prev) =>
        prev.map((q) => {
          if (q.id !== questId) return q;
          return {
            ...q,
            isFailed: false,
            failedAt: undefined,
            lastCompletedDate: undefined,
            nextScheduledDate: undefined,
          };
        })
      );
      triggerPointsToast(0, 'Задание возвращено в активную работу', false);
    },
    [triggerPointsToast]
  );

  // Automatically rollover completed or failed recurring tasks when their scheduled time/date arrives
  const checkRecurringRollovers = useCallback(() => {
    const now = Date.now();
    const todayDateStr = getAstanaDateString(now);

    setQuests((prevQuests) => {
      let hasChanges = false;
      const updated = prevQuests.map((q) => {
        if (q.isRecurring && (q.isCompleted || q.isFailed)) {
          const isDueForReset = q.nextScheduledDate
            ? now >= q.nextScheduledDate
            : todayDateStr !== q.lastCompletedDate;

          if (isDueForReset) {
            hasChanges = true;
            return {
              ...q,
              isCompleted: false,
              isFailed: false,
              deadlineTimestamp: 0,
              localDeadline: '',
              nextScheduledDate: undefined,
              lastCompletedDate: undefined,
            };
          }
        }
        return q;
      });
      return hasChanges ? updated : prevQuests;
    });
  }, []);

  useEffect(() => {
    checkRecurringRollovers();
    const interval = setInterval(checkRecurringRollovers, 30000);
    return () => clearInterval(interval);
  }, [checkRecurringRollovers]);

  // Helper: Client-side password hashing (Web Crypto API) for offline & Vercel resilience
  const hashPasswordClient = async (password: string): Promise<string> => {
    try {
      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        const enc = new TextEncoder();
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', enc.encode(password + '_questlog_salt_v1'));
        return Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
      }
    } catch {}
    return btoa(encodeURIComponent(password));
  };

  // Helper: Safe JSON fetch that never throws JSON.parse errors on HTML or 404 responses
  const fetchSafeJson = async (
    url: string,
    options?: RequestInit
  ): Promise<{ ok: boolean; status: number; data?: any; error?: string; isHtml?: boolean }> => {
    try {
      const resp = await fetch(url, options);
      const contentType = resp.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        return {
          ok: false,
          status: resp.status,
          isHtml: true,
          error: resp.status === 404 ? 'Сервер API недоступен (404)' : `Сервер вернул статус ${resp.status}`,
        };
      }
      const json = await resp.json();
      return {
        ok: resp.ok && json.ok !== false,
        status: resp.status,
        data: json,
        error: json.error || (resp.ok ? undefined : `Ошибка сервера (${resp.status})`),
      };
    } catch (err: any) {
      return {
        ok: false,
        status: 0,
        error: err.message || 'Ошибка сети',
      };
    }
  };

  // Helper: Load local account storage state
  const loadLocalAccountData = useCallback((cleanNick: string) => {
    try {
      const pSaved = localStorage.getItem(getAccountStorageKey(cleanNick, 'profile'));
      const sSaved = localStorage.getItem(getAccountStorageKey(cleanNick, 'skills'));
      const qSaved = localStorage.getItem(getAccountStorageKey(cleanNick, 'quests'));
      const dSaved = localStorage.getItem(getAccountStorageKey(cleanNick, 'deleted_ids'));
      const lSaved = localStorage.getItem(getAccountStorageKey(cleanNick, 'logs'));
      const mSaved = localStorage.getItem(getAccountStorageKey(cleanNick, 'moodle_url'));
      const penSaved = localStorage.getItem(getAccountStorageKey(cleanNick, 'penalties'));

      setProfile(pSaved ? JSON.parse(pSaved) : { ...DEFAULT_PROFILE, name: cleanNick });
      setSkills(sSaved ? JSON.parse(sSaved) : INITIAL_SKILLS);
      setQuests(qSaved ? JSON.parse(qSaved) : getInitialQuests());
      setDeletedQuestIds(dSaved ? JSON.parse(dSaved) : []);
      setLogs(lSaved ? JSON.parse(lSaved) : []);
      setMoodleUrl(mSaved || '');
      setPenalties(penSaved ? JSON.parse(penSaved) : DEFAULT_PENALTY_RULES);
    } catch {
      // fallback
    }
  }, []);

  // Cloud Accounts synchronization
  const fetchCloudAccounts = useCallback(async () => {
    try {
      const res = await fetchSafeJson('/api/auth/accounts');
      if (res.ok && res.data && Array.isArray(res.data.accounts)) {
        setAccounts((prev) => {
          const map = new Map<string, UserAccount>();
          prev.forEach((a) => map.set(a.username.toLowerCase(), a));
          res.data.accounts.forEach((ca: UserAccount) => {
            const existing = map.get(ca.username.toLowerCase());
            map.set(ca.username.toLowerCase(), {
              ...(existing || {}),
              ...ca,
              isCloud: true,
            });
          });
          return Array.from(map.values());
        });
      }
    } catch {
      // offline fallback
    }
  }, []);

  useEffect(() => {
    fetchCloudAccounts();
  }, [fetchCloudAccounts]);

  // Pull latest cloud data for active user if session token exists
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token || !currentUsername) return;

    fetchSafeJson(`/api/auth/user?username=${encodeURIComponent(currentUsername)}&token=${encodeURIComponent(token)}`)
      .then((resData) => {
        if (resData && resData.ok && resData.data?.data) {
          const d = resData.data.data;
          if (d.profile) setProfile(d.profile);
          if (Array.isArray(d.quests)) setQuests(d.quests);
          if (Array.isArray(d.skills)) setSkills(d.skills);
          if (Array.isArray(d.penalties)) setPenalties(d.penalties);
          if (Array.isArray(d.deletedQuestIds)) setDeletedQuestIds(d.deletedQuestIds);
          if (Array.isArray(d.logs)) setLogs(d.logs);
          if (d.moodleUrl !== undefined) setMoodleUrl(d.moodleUrl);
        }
      })
      .catch(() => {});
  }, [currentUsername]);

  // Debounced cloud synchronization across devices
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token || !currentUsername) return;

    const timer = setTimeout(() => {
      fetchSafeJson('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUsername,
          token,
          data: {
            profile,
            skills,
            quests,
            penalties,
            deletedQuestIds,
            logs,
            moodleUrl,
          },
        }),
      }).catch(() => {});
    }, 1500);

    return () => clearTimeout(timer);
  }, [currentUsername, profile, skills, quests, penalties, deletedQuestIds, logs, moodleUrl]);

  // Account switching and creation helpers with password authentication
  const handleSelectAccount = useCallback(
    async (username: string, password?: string): Promise<{ success: boolean; error?: string }> => {
      const cleanNick = username.trim();
      if (!cleanNick) return { success: false, error: 'Введите никнейм' };

      // Flush current state to local storage before switching
      localStorage.setItem(getAccountStorageKey(currentUsername, 'profile'), JSON.stringify(profile));
      localStorage.setItem(getAccountStorageKey(currentUsername, 'skills'), JSON.stringify(skills));
      localStorage.setItem(getAccountStorageKey(currentUsername, 'quests'), JSON.stringify(quests));
      localStorage.setItem(getAccountStorageKey(currentUsername, 'deleted_ids'), JSON.stringify(deletedQuestIds));
      localStorage.setItem(getAccountStorageKey(currentUsername, 'logs'), JSON.stringify(logs));
      localStorage.setItem(getAccountStorageKey(currentUsername, 'moodle_url'), moodleUrl);
      localStorage.setItem(getAccountStorageKey(currentUsername, 'penalties'), JSON.stringify(penalties));

      const enteredHash = await hashPasswordClient(password || '');

      // 1. Try server/Vercel login
      const apiRes = await fetchSafeJson('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanNick, password: password || '' }),
      });

      // If server explicitly returned 401 invalid password
      if (!apiRes.ok && apiRes.status === 401) {
        return { success: false, error: apiRes.error || 'Неверный пароль. Попробуйте снова.' };
      }

      // If server succeeded
      if (apiRes.ok && apiRes.data) {
        if (apiRes.data.token) {
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, apiRes.data.token);
        }

        setAccounts((prev) => {
          const exists = prev.some((a) => a.username.toLowerCase() === cleanNick.toLowerCase());
          if (exists) {
            return prev.map((a) =>
              a.username.toLowerCase() === cleanNick.toLowerCase()
                ? { ...a, lastLoginAt: Date.now(), isCloud: true, passwordHash: enteredHash }
                : a
            );
          }
          return [{ username: cleanNick, createdAt: Date.now(), lastLoginAt: Date.now(), isCloud: true, passwordHash: enteredHash }, ...prev];
        });

        if (apiRes.data.data && Object.keys(apiRes.data.data).length > 0) {
          const d = apiRes.data.data;
          if (d.profile) setProfile(d.profile);
          if (Array.isArray(d.quests)) setQuests(d.quests);
          if (Array.isArray(d.skills)) setSkills(d.skills);
          if (Array.isArray(d.penalties)) setPenalties(d.penalties);
          if (Array.isArray(d.deletedQuestIds)) setDeletedQuestIds(d.deletedQuestIds);
          if (Array.isArray(d.logs)) setLogs(d.logs);
          if (d.moodleUrl !== undefined) setMoodleUrl(d.moodleUrl);
        } else {
          loadLocalAccountData(cleanNick);
        }

        setCurrentUsername(cleanNick);
        localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, cleanNick);
        triggerPointsToast(0, `Вход выполнен! Аккаунт «${cleanNick}» синхронизирован`, false);
        return { success: true };
      }

      // If server returned non-JSON / 404 (e.g. static hosting on Vercel or offline):
      // Verify credentials locally!
      const localAccount = accounts.find((a) => a.username.toLowerCase() === cleanNick.toLowerCase());
      const storedHash = localStorage.getItem(getAccountStorageKey(cleanNick, 'pwd_hash')) || localAccount?.passwordHash;

      if (!localAccount && !storedHash) {
        return {
          success: false,
          error: `Аккаунт «${cleanNick}» не найден. Зарегистрируйтесь, если у вас еще нет аккаунта.`,
        };
      }

      if (storedHash && storedHash !== enteredHash) {
        return {
          success: false,
          error: 'Неверный пароль. Попробуйте снова.',
        };
      }

      setAccounts((prev) =>
        prev.map((a) =>
          a.username.toLowerCase() === cleanNick.toLowerCase()
            ? { ...a, lastLoginAt: Date.now(), passwordHash: enteredHash }
            : a
        )
      );

      // Save password hash for future logins if it was a legacy account
      localStorage.setItem(getAccountStorageKey(cleanNick, 'pwd_hash'), enteredHash);

      loadLocalAccountData(cleanNick);
      setCurrentUsername(cleanNick);
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, cleanNick);
      triggerPointsToast(0, `Вход выполнен! Аккаунт «${cleanNick}» активен`, false);
      return { success: true };
    },
    [accounts, currentUsername, profile, skills, quests, deletedQuestIds, logs, moodleUrl, penalties, triggerPointsToast, loadLocalAccountData]
  );

  const handleCreateAccount = useCallback(
    async (username: string, password?: string): Promise<{ success: boolean; error?: string }> => {
      const cleanNick = username.trim();
      if (!cleanNick) return { success: false, error: 'Введите никнейм' };

      // Flush current state before creating
      localStorage.setItem(getAccountStorageKey(currentUsername, 'profile'), JSON.stringify(profile));
      localStorage.setItem(getAccountStorageKey(currentUsername, 'skills'), JSON.stringify(skills));
      localStorage.setItem(getAccountStorageKey(currentUsername, 'quests'), JSON.stringify(quests));
      localStorage.setItem(getAccountStorageKey(currentUsername, 'deleted_ids'), JSON.stringify(deletedQuestIds));
      localStorage.setItem(getAccountStorageKey(currentUsername, 'logs'), JSON.stringify(logs));
      localStorage.setItem(getAccountStorageKey(currentUsername, 'moodle_url'), moodleUrl);
      localStorage.setItem(getAccountStorageKey(currentUsername, 'penalties'), JSON.stringify(penalties));

      const newProfile: UserProfile = {
        ...DEFAULT_PROFILE,
        name: cleanNick,
      };
      const newQuests = getInitialQuests();
      const newSkills = INITIAL_SKILLS;
      const newLogs: ActivityLogItem[] = [
        {
          id: `log-create-acc-${Date.now()}`,
          timestamp: Date.now(),
          type: 'sync',
          title: `Создан аккаунт «${cleanNick}»`,
          details: 'Успешная регистрация с паролем. Включено сохранение прогресса.',
          pointsChange: 0,
        },
      ];

      const clientHash = await hashPasswordClient(password || '');

      // 1. Try server/Vercel registration
      const apiRes = await fetchSafeJson('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanNick,
          password: password || '',
          initialData: {
            profile: newProfile,
            skills: newSkills,
            quests: newQuests,
            penalties: DEFAULT_PENALTY_RULES,
            deletedQuestIds: [],
            logs: newLogs,
            moodleUrl: '',
          },
        }),
      });

      // If server explicitly returned validation conflict error (409)
      if (!apiRes.ok && !apiRes.isHtml && apiRes.status === 409) {
        return { success: false, error: apiRes.error || `Аккаунт с ником «${cleanNick}» уже существует` };
      }

      if (apiRes.ok && apiRes.data?.token) {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, apiRes.data.token);
      }

      const isCloudSuccess = apiRes.ok;

      // Check if user already exists locally if server was unreachable
      if (!isCloudSuccess) {
        const localExists = accounts.some((a) => a.username.toLowerCase() === cleanNick.toLowerCase());
        if (localExists) {
          return { success: false, error: `Аккаунт с ником «${cleanNick}» уже существует на этом устройстве. Войдите с паролем.` };
        }
      }

      const newAcc: UserAccount = {
        username: cleanNick,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
        isCloud: isCloudSuccess,
        passwordHash: clientHash,
      };

      setAccounts((prev) => {
        const filtered = prev.filter((a) => a.username.toLowerCase() !== cleanNick.toLowerCase());
        return [newAcc, ...filtered];
      });

      setCurrentUsername(cleanNick);
      setProfile(newProfile);
      setQuests(newQuests);
      setSkills(newSkills);
      setDeletedQuestIds([]);
      setLogs(newLogs);
      setMoodleUrl('');
      setPenalties(DEFAULT_PENALTY_RULES);

      // Persist locally
      localStorage.setItem(getAccountStorageKey(cleanNick, 'profile'), JSON.stringify(newProfile));
      localStorage.setItem(getAccountStorageKey(cleanNick, 'skills'), JSON.stringify(newSkills));
      localStorage.setItem(getAccountStorageKey(cleanNick, 'quests'), JSON.stringify(newQuests));
      localStorage.setItem(getAccountStorageKey(cleanNick, 'deleted_ids'), JSON.stringify([]));
      localStorage.setItem(getAccountStorageKey(cleanNick, 'logs'), JSON.stringify(newLogs));
      localStorage.setItem(getAccountStorageKey(cleanNick, 'moodle_url'), '');
      localStorage.setItem(getAccountStorageKey(cleanNick, 'penalties'), JSON.stringify(DEFAULT_PENALTY_RULES));
      localStorage.setItem(getAccountStorageKey(cleanNick, 'pwd_hash'), clientHash);
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, cleanNick);

      triggerPointsToast(0, isCloudSuccess ? `Аккаунт «${cleanNick}» создан и синхронизирован!` : `Аккаунт «${cleanNick}» успешно создан!`, false);
      return { success: true };
    },
    [accounts, currentUsername, profile, skills, quests, deletedQuestIds, logs, moodleUrl, penalties, triggerPointsToast]
  );

  const handleDeleteAccount = useCallback(
    async (username: string) => {
      if (accounts.length <= 1) return;
      const cleanNick = username.trim();

      localStorage.removeItem(getAccountStorageKey(cleanNick, 'profile'));
      localStorage.removeItem(getAccountStorageKey(cleanNick, 'skills'));
      localStorage.removeItem(getAccountStorageKey(cleanNick, 'quests'));
      localStorage.removeItem(getAccountStorageKey(cleanNick, 'deleted_ids'));
      localStorage.removeItem(getAccountStorageKey(cleanNick, 'logs'));
      localStorage.removeItem(getAccountStorageKey(cleanNick, 'moodle_url'));
      localStorage.removeItem(getAccountStorageKey(cleanNick, 'penalties'));
      localStorage.removeItem(getAccountStorageKey(cleanNick, 'pwd_hash'));

      try {
        await fetchSafeJson('/api/auth/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: cleanNick }),
        });
      } catch {}

      const remaining = accounts.filter((a) => a.username.toLowerCase() !== cleanNick.toLowerCase());
      setAccounts(remaining);

      if (currentUsername.toLowerCase() === cleanNick.toLowerCase() && remaining.length > 0) {
        handleSelectAccount(remaining[0].username);
      }
    },
    [accounts, currentUsername, handleSelectAccount]
  );

  // Save edited quest (modifies all parameters: title, deadline, course, points, difficulty, recurring)
  const handleSaveEditedQuest = useCallback((updatedQuest: Quest) => {
    setQuests((prev) => prev.map((q) => (q.id === updatedQuest.id ? updatedQuest : q)));

    setLogs((prevLogs) => [
      {
        id: `log-edit-${Date.now()}`,
        timestamp: Date.now(),
        type: 'quest_edit',
        title: `Изменено: ${updatedQuest.cleanTitle}`,
        details: `Дедлайн: ${updatedQuest.localDeadline}, Награда: ${updatedQuest.points} б.`,
        pointsChange: 0,
      },
      ...prevLogs,
    ]);
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
            pointsChange: 0,
          },
          ...prevLogs,
        ]);
      }
      return prev.filter((q) => q.id !== questId);
    });

    setDeletedQuestIds((prev) => (prev.includes(questId) ? prev : [...prev, questId]));

    if (editingQuest?.id === questId) {
      setEditingQuest(null);
    }
  }, [editingQuest]);

  // Skills management: Add, Edit, Delete
  const handleAddSkill = useCallback((newSkillData: Omit<Skill, 'id' | 'points'>) => {
    const newSkill: Skill = {
      ...newSkillData,
      id: `skill-${Date.now()}`,
      points: 0,
    };
    setSkills((prev) => [...prev, newSkill]);
    setLogs((prev) => [
      {
        id: `log-sk-create-${Date.now()}`,
        timestamp: Date.now(),
        type: 'skill_create',
        title: `Создан новый навык: ${newSkill.name}`,
        pointsChange: 0,
      },
      ...prev,
    ]);
  }, []);

  const handleEditSkill = useCallback((updatedSkill: Skill) => {
    setSkills((prev) => prev.map((s) => (s.id === updatedSkill.id ? updatedSkill : s)));
    setLogs((prev) => [
      {
        id: `log-sk-edit-${Date.now()}`,
        timestamp: Date.now(),
        type: 'skill_edit',
        title: `Отредактирован навык: ${updatedSkill.name}`,
        pointsChange: 0,
      },
      ...prev,
    ]);
  }, []);

  const handleDeleteSkill = useCallback((skillId: string) => {
    setSkills((prev) => {
      const target = prev.find((s) => s.id === skillId);
      if (target) {
        setLogs((prevLogs) => [
          {
            id: `log-sk-del-${Date.now()}`,
            timestamp: Date.now(),
            type: 'skill_delete',
            title: `Удален навык: ${target.name}`,
            pointsChange: 0,
          },
          ...prevLogs,
        ]);
      }
      return prev.filter((s) => s.id !== skillId);
    });

    // Unlink quests that pointed to this skill
    setQuests((prev) =>
      prev.map((q) => (q.linkedSkillId === skillId ? { ...q, linkedSkillId: '' } : q))
    );
  }, []);

  // Add user-created custom quest
  const handleCreateCustomQuest = useCallback((newQuest: Quest) => {
    setQuests((prev) => [newQuest, ...prev]);
    setLogs((prev) => [
      {
        id: `log-q-create-${Date.now()}`,
        timestamp: Date.now(),
        type: 'quest_create',
        title: `Создано задание: ${newQuest.cleanTitle}`,
        details: `Дедлайн: ${newQuest.localDeadline} (+${newQuest.points} б.)`,
        pointsChange: 0,
      },
      ...prev,
    ]);
  }, []);

  // Add custom penalty rule
  const handleAddPenalty = useCallback((newRuleData: Omit<PenaltyRule, 'id'>) => {
    const newRule: PenaltyRule = {
      ...newRuleData,
      id: `penalty-custom-${Date.now()}`,
    };
    setPenalties((prev) => [...prev, newRule]);
    setLogs((prev) => [
      {
        id: `log-pen-create-${Date.now()}`,
        timestamp: Date.now(),
        type: 'penalty_create',
        title: `Создано правило штрафа: ${newRule.title}`,
        details: `Списание: -${newRule.points} б. ${newRule.description || ''}`,
        pointsChange: 0,
      },
      ...prev,
    ]);
    triggerPointsToast(0, `Штраф «${newRule.title}» добавлен`, false);
  }, [triggerPointsToast]);

  // Edit penalty rule
  const handleEditPenalty = useCallback((updatedRule: PenaltyRule) => {
    setPenalties((prev) => prev.map((p) => (p.id === updatedRule.id ? updatedRule : p)));
    setLogs((prev) => [
      {
        id: `log-pen-edit-${Date.now()}`,
        timestamp: Date.now(),
        type: 'penalty_edit',
        title: `Изменен штраф: ${updatedRule.title}`,
        details: `Новое списание: -${updatedRule.points} б.`,
        pointsChange: 0,
      },
      ...prev,
    ]);
    triggerPointsToast(0, `Штраф «${updatedRule.title}» обновлен`, false);
  }, [triggerPointsToast]);

  // Delete penalty rule
  const handleDeletePenalty = useCallback((ruleId: string) => {
    setPenalties((prev) => {
      const target = prev.find((p) => p.id === ruleId);
      if (target) {
        setLogs((prevLogs) => [
          {
            id: `log-pen-del-${Date.now()}`,
            timestamp: Date.now(),
            type: 'penalty_delete',
            title: `Удален штраф: ${target.title}`,
            pointsChange: 0,
          },
          ...prevLogs,
        ]);
      }
      return prev.filter((p) => p.id !== ruleId);
    });
  }, []);

  // Reset penalties to default 4 rules
  const handleResetPenaltiesToDefault = useCallback(() => {
    setPenalties(DEFAULT_PENALTY_RULES);
    setLogs((prev) => [
      {
        id: `log-pen-reset-${Date.now()}`,
        timestamp: Date.now(),
        type: 'penalty_edit',
        title: 'Восстановлены стандартные штрафы',
        details: 'Установлены 4 базовых правила дисциплины',
        pointsChange: 0,
      },
      ...prev,
    ]);
    triggerPointsToast(0, 'Стандартные штрафы восстановлены', false);
  }, [triggerPointsToast]);

  // Update weekly balancing target points (200, 400, 600, 1000, 5000, 10000)
  const handleUpdateWeeklyTarget = useCallback((newTarget: number) => {
    setProfile((prev) => ({ ...prev, weeklyTargetPoints: newTarget }));

    // Scale rewards immediately ONLY for active (uncompleted) quests!
    // Already completed quests remain untouched with their historical points.
    setQuests((prevQuests) =>
      prevQuests.map((q) => {
        if (q.isCompleted) {
          return q;
        }
        const scaled = getRankPointsForTarget(q.difficulty || 'B', newTarget);
        return {
          ...q,
          points: scaled,
          baseExp: scaled,
        };
      })
    );

    const sRankReward = getRankPointsForTarget('S', newTarget);
    setLogs((prev) => [
      {
        id: `log-target-${Date.now()}`,
        timestamp: Date.now(),
        type: 'setting_change',
        title: `Изменена недельная балансировка: ${newTarget} б.`,
        details: `Рекомендованный объем: ${newTarget} б./нед. Награды активных квестов обновлены (Ранг S: ${sRankReward} б.). Завершенные задачи сохранены без изменений.`,
        pointsChange: 0,
      },
      ...prev,
    ]);
    triggerPointsToast(0, `Недельная цель: ${newTarget} б. Награды обновлены`, false);
  }, [triggerPointsToast]);

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

    const parsedLms = parseMoodleIcs(icsText, existingMap, deletedSet);
    const merged = mergeQuestsWithLms(quests, parsedLms, deletedSet);
    setQuests(merged);
    setProfile((prev) => ({ ...prev, lastSyncTimestamp: Date.now() }));

    setLogs((prev) => [
      {
        id: `log-sync-${Date.now()}`,
        timestamp: Date.now(),
        type: 'sync',
        title: `Синхронизация с Moodle LMS завершена`,
        details: `Синхронизировано ${parsedLms.length} заданий LMS. Все созданные задания и привычки сохранены (${merged.length} квестов всего).`,
        pointsChange: 0,
      },
      ...prev,
    ]);

    return { success: true, count: parsedLms.length };
  };

  // 1-Click Direct Sync Handler: Immediately syncs without opening the configuration modal
  const handleDirectSync = async () => {
    if (!moodleUrl || !moodleUrl.trim()) {
      setIsSyncModalOpen(true);
      return;
    }
    await handleSyncFromUrl(moodleUrl);
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
    const parsedLms = parseMoodleIcs(text, existingMap, deletedSet);
    const merged = mergeQuestsWithLms(quests, parsedLms, deletedSet);
    setQuests(merged);
    setProfile((prev) => ({ ...prev, lastSyncTimestamp: Date.now() }));

    setLogs((prev) => [
      {
        id: `log-import-${Date.now()}`,
        timestamp: Date.now(),
        type: 'sync',
        title: 'Импорт файла расписания Moodle',
        details: `Синхронизировано ${parsedLms.length} заданий LMS. Все созданные задания сохранены (${merged.length} квестов всего).`,
        pointsChange: 0,
      },
      ...prev,
    ]);

    return { success: true, count: parsedLms.length };
  };

  // Reset to default balanced schedule
  const handleResetToDefault = () => {
    setDeletedQuestIds([]);
    setMoodleUrl(DEFAULT_MOODLE_URL);
    const initial = getInitialQuests();
    setQuests(initial);
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

  // Today's Agenda Quests (Досуг и задачи на сегодня: Сон до 23:00, Тренировка, Бег, Задание по SDP)
  const todayAgendaQuests = useMemo(() => {
    return quests
      .filter((q) => isTaskScheduledForToday(q))
      .sort((a, b) => {
        const aIsClosed = Boolean(a.isCompleted || a.isFailed);
        const bIsClosed = Boolean(b.isCompleted || b.isFailed);
        if (aIsClosed !== bIsClosed) {
          return aIsClosed ? 1 : -1;
        }
        return (a.deadlineTimestamp || 0) - (b.deadlineTimestamp || 0);
      });
  }, [quests]);

  // Filtered and sorted quests
  const filteredQuests = useMemo(() => {
    return quests
      .filter((q) => {
        if (filters.searchQuery) {
          const qText = `${q.cleanTitle} ${q.description} ${q.courseName} ${q.instructor}`.toLowerCase();
          if (!qText.includes(filters.searchQuery.toLowerCase())) return false;
        }

        if (filters.status === 'today') {
          return isTaskScheduledForToday(q);
        }

        const status = getQuestStatus(q);
        if (filters.status === 'active' && (status === 'completed' || status === 'failed')) return false;
        if (filters.status === 'burning' && status !== 'burning') return false;
        if (filters.status === 'completed' && status !== 'completed') return false;
        if (filters.status === 'failed' && (status !== 'failed' && !q.isFailed)) return false;

        if (filters.course !== 'all' && q.courseName !== filters.course) return false;
        if (filters.skill !== 'all' && q.linkedSkillId !== filters.skill) return false;
        if (filters.difficulty !== 'all' && q.difficulty !== filters.difficulty) return false;

        return true;
      })
      .sort((a, b) => {
        // Completed AND Failed quests always sink to the bottom
        const aIsClosed = Boolean(a.isCompleted || a.isFailed);
        const bIsClosed = Boolean(b.isCompleted || b.isFailed);
        if (aIsClosed !== bIsClosed) {
          return aIsClosed ? 1 : -1;
        }

        // If both are closed, group completed then failed
        if (aIsClosed && bIsClosed) {
          if (Boolean(a.isFailed) !== Boolean(b.isFailed)) {
            return a.isFailed ? 1 : -1;
          }
        }

        // Within their respective groups, sort by selected criteria
        const timeA = a.deadlineTimestamp || 0;
        const timeB = b.deadlineTimestamp || 0;
        if (filters.sortBy === 'deadline_asc') return timeA - timeB;
        if (filters.sortBy === 'deadline_desc') return timeB - timeA;
        if (filters.sortBy === 'points_desc') {
          const pA = a.points || 0;
          const pB = b.points || 0;
          return pB - pA;
        }
        if (filters.sortBy === 'title') return a.cleanTitle.localeCompare(b.cleanTitle);
        return timeA - timeB;
      });
  }, [quests, filters]);

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-200">
      {/* Top Bar with 2 themes & Points balance & Account switcher & Penalties */}
      <TopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentTheme={theme}
        onToggleTheme={handleToggleTheme}
        isSyncing={isSyncing}
        onDirectSync={handleDirectSync}
        onOpenSyncModal={() => {
          setSyncModalInitialTab('balance');
          setIsSyncModalOpen(true);
        }}
        soundEnabled={profile.soundEnabled}
        onToggleSound={() => setProfile((p) => ({ ...p, soundEnabled: !p.soundEnabled }))}
        points={profile.points}
        onOpenSpendModal={() => setIsSpendModalOpen(true)}
        currentUsername={currentUsername}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        onOpenPenaltyModal={() => setIsPenaltyModalOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <PlayerHUD
          profile={profile}
          quests={quests}
          onUpdateProfile={(updated) => setProfile((prev) => ({ ...prev, ...updated }))}
          onOpenNewQuestModal={() => setIsNewQuestModalOpen(true)}
          onOpenSpendModal={() => setIsSpendModalOpen(true)}
          onOpenAccountModal={() => setIsAccountModalOpen(true)}
          onOpenResetModal={() => setIsResetProgressModalOpen(true)}
          onOpenPenaltyModal={() => setIsPenaltyModalOpen(true)}
          onOpenSettingsModal={() => {
            setSyncModalInitialTab('balance');
            setIsSyncModalOpen(true);
          }}
        />

        {/* Tab 1: Quests List */}
        {activeTab === 'quests' && (
          <div className="space-y-6">
            {/* Досуг и задачи дня (Today's Agenda Widget) */}
            <div
              className="rounded-2xl border p-4 sm:p-5 shadow-sm transition-all"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3.5 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
                    <Sun className="w-5 h-5 text-amber-500" />
                    <span>Досуг и задачи на сегодня</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      {todayAgendaQuests.length} в плане
                    </span>
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Сон до 23:00, тренировка, бег и ключевые университетские дедлайны (недельная цель: {profile.weeklyTargetPoints || 200} б.)
                  </p>
                </div>

                <button
                  onClick={() => setFilters((f) => ({ ...f, status: f.status === 'today' ? 'all' : 'today' }))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    filters.status === 'today'
                      ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                      : 'text-[var(--text-main)] hover:border-[var(--accent-primary)]'
                  }`}
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  {filters.status === 'today' ? 'Показать все задачи' : 'Фокус только на сегодня'}
                </button>
              </div>

              {/* Quick Daily Tasks Pill Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {todayAgendaQuests.length === 0 ? (
                  <div className="col-span-full py-4 text-center text-xs text-[var(--text-muted)]">
                    Все задачи на сегодня выполнены! Отличная работа.
                  </div>
                ) : (
                  todayAgendaQuests.slice(0, 4).map((q) => (
                    <div
                      key={q.id}
                      className="p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all hover:border-[var(--accent-primary)]"
                      style={{
                        backgroundColor: 'var(--bg-surface-hover)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <button
                        onClick={() => handleCompleteQuest(q.id)}
                        title="Отметить выполненным"
                        className="p-1 text-[var(--text-muted)] hover:text-emerald-500 transition-colors"
                      >
                        <Circle className="w-4 h-4" />
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-[var(--text-main)] truncate">
                          {q.cleanTitle}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] font-mono truncate">
                          {q.courseName} · {getRecurrenceDescription(q) || 'Сегодня'}
                        </div>
                      </div>

                      <span className="text-xs font-mono font-bold text-amber-500 shrink-0">
                        +{q.points} б.
                      </span>
                    </div>
                  ))
                )}
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
                    placeholder="Поиск по названию или предмету..."
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
                    onClick={() => setFilters((f) => ({ ...f, status: 'today' }))}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-1 ${
                      filters.status === 'today'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'text-amber-500 hover:text-amber-400'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>На сегодня ({todayAgendaQuests.length})</span>
                  </button>

                  <button
                    onClick={() => setFilters((f) => ({ ...f, status: 'burning' }))}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-1 ${
                      filters.status === 'burning'
                        ? 'bg-orange-500 text-white font-bold shadow-sm'
                        : 'text-orange-500 hover:text-orange-400'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Горят</span>
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
                    Не выполнено {quests.some((q) => q.isFailed) && `(${quests.filter((q) => q.isFailed).length})`}
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
                        Ранг {r} (+{QUEST_RANKS[r]?.points || 5} б.)
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
                    <option value="points_desc">По награде (максимум баллов)</option>
                    <option value="title">По названию (А-Я)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Quests Grid - Always open, minimal info */}
            {filteredQuests.length === 0 ? (
              <div
                className="rounded-2xl border p-12 text-center"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              >
                <Sparkles className="w-12 h-12 mx-auto text-[var(--accent-primary)] opacity-40 mb-3" />
                <h3 className="font-bold text-base text-[var(--text-main)]">Задания не найдены</h3>
                <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto mt-1">
                  Сбросьте фильтры поиска или добавьте новые задачи в свой план.
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
              <div className="space-y-2.5">
                {filteredQuests.map((quest) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    skills={skills}
                    onCompleteQuest={handleCompleteQuest}
                    onUncompleteQuest={handleUncompleteQuest}
                    onDeleteQuest={handleDeleteQuest}
                    onOpenEditModal={(q) => setEditingQuest(q)}
                    onApplyPenalty={handleQuestPenalty}
                    onFailQuest={handleFailQuest}
                    onUnfailQuest={handleUnfailQuest}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Skills Tree */}
        {activeTab === 'skills' && (
          <SkillsTree
            skills={skills}
            quests={quests}
            onAddSkill={handleAddSkill}
            onEditSkill={handleEditSkill}
            onDeleteSkill={handleDeleteSkill}
          />
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

      {/* Floating Points Toast Notification (+ or -) */}
      {pointsToast && (
        <div className="fixed bottom-6 right-6 z-50 exp-float-anim pointer-events-none">
          <div
            className="px-4 py-2 rounded-xl border text-sm font-bold shadow-lg flex items-center gap-2 text-white"
            style={{
              backgroundColor: pointsToast.isDeduction ? '#ef4444' : '#10b981',
              borderColor: pointsToast.isDeduction ? '#dc2626' : '#059669',
            }}
          >
            <Coins className="w-4 h-4 text-amber-300" />
            <span>
              {pointsToast.isDeduction ? `-${pointsToast.points}` : `+${pointsToast.points}`} б.!
            </span>
            <span className="text-xs font-normal opacity-90 truncate max-w-[200px]">
              {pointsToast.text}
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
        weeklyTargetPoints={profile.weeklyTargetPoints || 200}
        onUpdateWeeklyTarget={handleUpdateWeeklyTarget}
        initialTab={syncModalInitialTab}
      />

      <SpendPointsModal
        isOpen={isSpendModalOpen}
        onClose={() => setIsSpendModalOpen(false)}
        currentPoints={profile.points}
        onSpendPoints={handleSpendPoints}
      />

      <EditQuestModal
        quest={editingQuest}
        isOpen={Boolean(editingQuest)}
        onClose={() => setEditingQuest(null)}
        skills={skills}
        onSaveQuest={handleSaveEditedQuest}
        onDeleteQuest={handleDeleteQuest}
        weeklyTargetPoints={profile.weeklyTargetPoints || 200}
      />

      <CustomQuestModal
        isOpen={isNewQuestModalOpen}
        onClose={() => setIsNewQuestModalOpen(false)}
        skills={skills}
        onCreateQuest={handleCreateCustomQuest}
        weeklyTargetPoints={profile.weeklyTargetPoints || 200}
      />

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        currentUsername={currentUsername}
        accounts={accounts}
        onSelectAccount={handleSelectAccount}
        onCreateAccount={handleCreateAccount}
        onDeleteAccount={handleDeleteAccount}
        onRefreshCloudAccounts={fetchCloudAccounts}
      />

      <ResetProgressModal
        isOpen={isResetProgressModalOpen}
        onClose={() => setIsResetProgressModalOpen(false)}
        currentPoints={profile.points}
        onConfirmReset={handleResetProgress}
      />

      <PenaltyModal
        isOpen={isPenaltyModalOpen}
        onClose={() => setIsPenaltyModalOpen(false)}
        currentPoints={profile.points}
        penalties={penalties}
        onApplyPenalty={handleApplyPenalty}
        onAddPenalty={handleAddPenalty}
        onEditPenalty={handleEditPenalty}
        onDeletePenalty={handleDeletePenalty}
        onResetPenaltiesToDefault={handleResetPenaltiesToDefault}
      />
    </div>
  );
}
