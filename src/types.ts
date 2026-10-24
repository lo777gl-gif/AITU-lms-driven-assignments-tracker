/**
 * Core types for QuestLog RPG Task Tracker
 */

export type ThemeId = 'dark' | 'light';

export type QuestRank = 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface SubQuest {
  id: string;
  text: string;
  isCompleted: boolean;
  exp: number; // Small reward (15-25 XP)
}

export type QuestStatus = 'active' | 'burning' | 'completed' | 'failed';

export interface Quest {
  id: string; // Event UID
  summary: string; // Quest Title
  cleanTitle: string; // Title with 'is due' / 'closes' cleaned
  description: string; // Formatted description
  categories: string; // Course | Instructor raw
  courseName: string; // Parsed course name
  instructor: string; // Parsed instructor name
  dtStart: string; // ISO string in UTC
  dtEnd: string; // ISO string in UTC
  localDeadline: string; // Local ASTANA (UTC+5) formatted string
  deadlineTimestamp: number; // Epoch ms for time calculations
  isCompleted: boolean;
  completedAt?: string;
  subquests: SubQuest[];
  linkedSkillId: string;
  baseExp: number; // Configurable based on Rank (S-F)
  isCustom?: boolean; // User created side quest
  difficulty: QuestRank; // Configurable S, A, B, C, D, E, F
}

export interface Skill {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  level: number;
  exp: number;
  maxExp: number;
  courseKeywords: string[]; // Keywords to auto-match course name
}

export interface UserProfile {
  name: string;
  level: number;
  exp: number;
  maxExp: number;
  totalExpEarned: number;
  completedQuestsCount: number;
  soundEnabled: boolean;
  lastSyncTimestamp: number;
  streakDays: number;
  perksUnlocked: string[];
}

export interface ActivityLogItem {
  id: string;
  timestamp: number;
  type: 'quest_complete' | 'subquest_complete' | 'level_up' | 'skill_level_up' | 'sync' | 'quest_create' | 'quest_delete';
  title: string;
  details?: string;
  expGained: number;
  skillId?: string;
  skillName?: string;
}

export interface FilterOptions {
  searchQuery: string;
  status: 'all' | 'active' | 'burning' | 'completed' | 'failed';
  course: string;
  skill: string;
  difficulty: 'all' | QuestRank;
  sortBy: 'deadline_asc' | 'deadline_desc' | 'exp_desc' | 'title';
}
