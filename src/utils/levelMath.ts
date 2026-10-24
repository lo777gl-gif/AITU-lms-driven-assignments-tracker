import { QuestRank } from '../types';

/**
 * Calculates EXP required for next level based on formula:
 * NextLevelXP = CurrentLevel * 150
 */
export function getExpForLevel(level: number): number {
  return Math.max(150, level * 150);
}

export interface QuestRankInfo {
  rank: QuestRank;
  label: string;
  exp: number;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const QUEST_RANKS: Record<QuestRank, QuestRankInfo> = {
  S: {
    rank: 'S',
    label: 'Ранг S (Экзамен / Финал)',
    exp: 400,
    badgeBg: '#7c3aed', // Solid Purple
    badgeText: '#ffffff',
    badgeBorder: '#8b5cf6',
  },
  A: {
    rank: 'A',
    label: 'Ранг A (Рубежный контроль)',
    exp: 320,
    badgeBg: '#dc2626', // Solid Crimson
    badgeText: '#ffffff',
    badgeBorder: '#ef4444',
  },
  B: {
    rank: 'B',
    label: 'Ранг B (Лабораторная работа)',
    exp: 250,
    badgeBg: '#ea580c', // Solid Orange
    badgeText: '#ffffff',
    badgeBorder: '#f97316',
  },
  C: {
    rank: 'C',
    label: 'Ранг C (Практическое задание)',
    exp: 200,
    badgeBg: '#2563eb', // Solid Blue
    badgeText: '#ffffff',
    badgeBorder: '#3b82f6',
  },
  D: {
    rank: 'D',
    label: 'Ранг D (Асинхронное задание)',
    exp: 150,
    badgeBg: '#059669', // Solid Emerald
    badgeText: '#ffffff',
    badgeBorder: '#10b981',
  },
  E: {
    rank: 'E',
    label: 'Ранг E (Чтение / Конспект)',
    exp: 100,
    badgeBg: '#475569', // Solid Slate
    badgeText: '#ffffff',
    badgeBorder: '#64748b',
  },
  F: {
    rank: 'F',
    label: 'Ранг F (Мини-задача)',
    exp: 50,
    badgeBg: '#334155', // Solid Dark Slate
    badgeText: '#cbd5e1',
    badgeBorder: '#475569',
  },
};

export const RANK_LIST: QuestRank[] = ['S', 'A', 'B', 'C', 'D', 'E', 'F'];

/**
 * Returns rank title based on skill or player level
 */
export function getRankTitle(level: number): { title: string; tier: string } {
  if (level >= 25) return { title: 'Архимаг', tier: 'V' };
  if (level >= 18) return { title: 'Гроссмейстер', tier: 'IV' };
  if (level >= 12) return { title: 'Эксперт', tier: 'III' };
  if (level >= 7) return { title: 'Специалист', tier: 'II' };
  if (level >= 3) return { title: 'Подмастерье', tier: 'I' };
  return { title: 'Новичок', tier: '0' };
}

/**
 * Perks unlocked upon leveling up
 */
export interface LevelPerk {
  id: string;
  levelRequired: number;
  name: string;
  description: string;
  icon: string;
}

export const AVAILABLE_PERKS: LevelPerk[] = [
  {
    id: 'perk-focus-surge',
    levelRequired: 2,
    name: 'Фокус-Спринт',
    description: '+10% дополнительного EXP за сдачу квестов раньше дедлайна.',
    icon: '⚡',
  },
  {
    id: 'perk-subquest-master',
    levelRequired: 4,
    name: 'Аналитический Декомпозитор',
    description: '+5 EXP за каждый закрытый подквест.',
    icon: '🧩',
  },
  {
    id: 'perk-burning-adrenaline',
    levelRequired: 6,
    name: 'Огненный Адреналин',
    description: 'Горящие квесты (<48ч) приносят на +25% больше очков опыта.',
    icon: '🔥',
  },
  {
    id: 'perk-academic-shield',
    levelRequired: 8,
    name: 'Академический Щит',
    description: 'Защита от штрафов и отслеживание высокой успеваемости.',
    icon: '🛡️',
  },
  {
    id: 'perk-archmage-stride',
    levelRequired: 10,
    name: 'Поступь Мастера',
    description: 'Ускоренное развитие всех вторичных навыков на 20%.',
    icon: '👑',
  },
];
