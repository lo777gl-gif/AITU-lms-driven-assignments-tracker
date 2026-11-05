/**
 * Core types for QuestLog Task Tracker (Points System & Recurring Tasks)
 */

export type ThemeId = 'dark' | 'light';

export type QuestRank = 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

/**
 * Recurrence Types:
 * - 'daily': Каждый день
 * - 'interval_days': Раз в N дней
 * - 'weekdays': Выбрать дни недели (1=Пн, 2=Вт, 3=Ср, 4=Чт, 5=Пт, 6=Сб, 7=Вс)
 */
export type RecurrenceType = 'daily' | 'interval_days' | 'weekdays';

export type QuestStatus = 'active' | 'burning' | 'completed' | 'failed';

export interface Quest {
  id: string; // Event UID
  summary: string; // Quest Title
  cleanTitle: string; // Title cleaned
  description: string; // Short note or description
  categories: string; // Course | Category raw
  courseName: string; // Parsed course or category name (e.g. "Режим дня", "Спорт", "SDP")
  instructor: string; // Parsed instructor or additional info
  dtStart: string; // ISO string in UTC
  dtEnd: string; // ISO string in UTC
  localDeadline: string; // Local ASTANA (UTC+5) formatted string
  deadlineTimestamp: number; // Epoch ms for time calculations
  isCompleted: boolean;
  completedAt?: string;
  linkedSkillId: string;
  points: number; // 5-45 баллов (согласно балансировке до 200 б./неделя)
  baseExp?: number; // legacy alias
  isCustom?: boolean; // User created task
  difficulty: QuestRank; // Configurable S, A, B, C, D, E, F
  
  // Recurring Tasks: "Каждый день", "Раз в N дней", "Выбрать дни недели"
  isRecurring?: boolean;
  recurrenceType?: RecurrenceType;
  recurrenceInterval?: string; // legacy alias
  recurrenceDays?: number; // For 'interval_days' (e.g. every 3 days)
  recurrenceWeekdays?: number[]; // For 'weekdays' (e.g. [1, 3, 5] for Mon, Wed, Fri)
  recurrenceTime?: string; // Configurable update time (e.g. "23:00", "09:00", "00:00")
  lastCompletedDate?: string; // "YYYY-MM-DD" in Astana time when last completed
  nextScheduledDate?: number; // Epoch ms when the task will reset / reappear
  completedCount?: number; // Number of times completed
  
  // Daily agenda flag
  isTodayAgenda?: boolean;

  // Penalty tracking
  isPenalized?: boolean;
}

export interface UserAccount {
  username: string; // Nickname / login
  createdAt: number;
  lastLoginAt: number;
}

export interface Skill {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  points: number; // Points earned in this discipline
  courseKeywords: string[]; // Keywords to auto-match course name
}

export interface PenaltyRule {
  id: string;
  title: string;
  description: string;
  points: number; // e.g. 5, 10, 20
  icon?: string; // e.g. 'moon' | 'dumbbell' | 'footprints' | 'graduation' | 'alert' | 'flame' | 'clock' | 'coffee'
  isDefault?: boolean;
}

export interface WeeklyBalanceOption {
  value: number;
  label: string;
  isRecommended?: boolean;
  desc: string;
}

export interface UserProfile {
  name: string;
  points: number; // Current spendable balance
  totalPointsEarned: number; // Total points earned over time
  totalPointsSpent: number; // Total points spent over time
  totalPenalties: number; // Total points lost to penalties
  completedQuestsCount: number;
  soundEnabled: boolean;
  lastSyncTimestamp: number;
  streakDays: number;
  weeklyTargetPoints?: number; // 200, 500, 1000, 5000, 10000
}

export interface ActivityLogItem {
  id: string;
  timestamp: number;
  type:
    | 'quest_complete'
    | 'quest_uncomplete'
    | 'penalty'
    | 'reset_progress'
    | 'points_spend'
    | 'sync'
    | 'quest_create'
    | 'quest_delete'
    | 'quest_edit'
    | 'skill_create'
    | 'skill_edit'
    | 'skill_delete'
    | 'penalty_create'
    | 'penalty_edit'
    | 'penalty_delete'
    | 'setting_change';
  title: string;
  details?: string;
  pointsChange: number; // + for earned, - for spent, 0 for info
  expGained?: number; // legacy compatibility
  skillId?: string;
  skillName?: string;
}

export interface FilterOptions {
  searchQuery: string;
  status: 'all' | 'today' | 'active' | 'burning' | 'completed' | 'recurring' | 'failed';
  course: string;
  skill: string;
  difficulty: 'all' | QuestRank;
  sortBy: 'deadline_asc' | 'deadline_desc' | 'points_desc' | 'title';
}

export interface SpendRewardPreset {
  id: string;
  title: string;
  description: string;
  cost: number;
  icon: string;
}
