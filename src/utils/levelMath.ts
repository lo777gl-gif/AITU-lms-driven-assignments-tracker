import { Quest, QuestRank, RecurrenceType, SpendRewardPreset, PenaltyRule, WeeklyBalanceOption } from '../types';

export interface QuestRankInfo {
  rank: QuestRank;
  label: string;
  points: number;
  exp: number; // legacy alias
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

/**
 * Балансировка баллов (не более ~200 баллов в неделю):
 * - Сон до 23:00: 5 б. ежедневно = 35 б./нед.
 * - Утренняя тренировка: 5 б. (Пн-Пт) = 25 б./нед.
 * - Бег: 5 б. (Пн, Ср, Пт) = 15 б./нед.
 * - Университетские задания: 2 по 40 б. (Ранг A) + 1 сложное на 45 б. (Ранг S) = 125 б./нед.
 * ИТОГО: 35 + 25 + 15 + 125 = 200 баллов в неделю.
 */
export const QUEST_RANKS: Record<QuestRank, QuestRankInfo> = {
  S: {
    rank: 'S',
    label: 'Ранг S (Сложное задание / Экзамен)',
    points: 45,
    exp: 45,
    badgeBg: '#7c3aed', // Purple
    badgeText: '#ffffff',
    badgeBorder: '#8b5cf6',
  },
  A: {
    rank: 'A',
    label: 'Ранг A (Лабораторная / Задание)',
    points: 40,
    exp: 40,
    badgeBg: '#dc2626', // Crimson
    badgeText: '#ffffff',
    badgeBorder: '#ef4444',
  },
  B: {
    rank: 'B',
    label: 'Ранг B (Практическое задание)',
    points: 30,
    exp: 30,
    badgeBg: '#ea580c', // Orange
    badgeText: '#ffffff',
    badgeBorder: '#f97316',
  },
  C: {
    rank: 'C',
    label: 'Ранг C (Рубежная мини-задача)',
    points: 20,
    exp: 20,
    badgeBg: '#2563eb', // Blue
    badgeText: '#ffffff',
    badgeBorder: '#3b82f6',
  },
  D: {
    rank: 'D',
    label: 'Ранг D (Асинхронное задание)',
    points: 15,
    exp: 15,
    badgeBg: '#059669', // Emerald
    badgeText: '#ffffff',
    badgeBorder: '#10b981',
  },
  E: {
    rank: 'E',
    label: 'Ранг E (Повторение / Чтение)',
    points: 10,
    exp: 10,
    badgeBg: '#475569', // Slate
    badgeText: '#ffffff',
    badgeBorder: '#64748b',
  },
  F: {
    rank: 'F',
    label: 'Ранг F (Привычка / Режим / Спорт)',
    points: 5,
    exp: 5,
    badgeBg: '#1e293b', // Dark Slate
    badgeText: '#f8fafc',
    badgeBorder: '#475569',
  },
};

export const RANK_LIST: QuestRank[] = ['S', 'A', 'B', 'C', 'D', 'E', 'F'];

/**
 * Дни недели (ISO: 1 = Понедельник, 7 = Воскресенье)
 */
export const WEEKDAYS = [
  { id: 1, short: 'Пн', full: 'Понедельник' },
  { id: 2, short: 'Вт', full: 'Вторник' },
  { id: 3, short: 'Ср', full: 'Среда' },
  { id: 4, short: 'Чт', full: 'Четверг' },
  { id: 5, short: 'Пт', full: 'Пятница' },
  { id: 6, short: 'Сб', full: 'Суббота' },
  { id: 7, short: 'Вс', full: 'Воскресенье' },
];

/**
 * Оставлено только 3 режима повторения:
 * 1. Каждый день
 * 2. Раз в N дней
 * 3. Выбрать дни недели
 */
export const RECURRENCE_OPTIONS: { id: RecurrenceType; label: string }[] = [
  { id: 'daily', label: 'Каждый день' },
  { id: 'interval_days', label: 'Раз в N дней' },
  { id: 'weekdays', label: 'Выбрать дни недели' },
];

/**
 * Возвращает дату в формате YYYY-MM-DD в часовом поясе Астаны (UTC+5)
 */
export function getAstanaDateString(timestamp: number = Date.now()): string {
  const astanaOffsetMs = 5 * 60 * 60 * 1000;
  return new Date(timestamp + astanaOffsetMs).toISOString().slice(0, 10);
}

/**
 * Возвращает ISO день недели в часовом поясе Астаны (UTC+5):
 * 1 = Пн, 2 = Вт, 3 = Ср, 4 = Чт, 5 = Пт, 6 = Сб, 7 = Вс
 */
export function getAstanaDayOfWeek(timestamp: number = Date.now()): number {
  const astanaOffsetMs = 5 * 60 * 60 * 1000;
  const d = new Date(timestamp + astanaOffsetMs);
  const day = d.getUTCDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
  return day === 0 ? 7 : day;
}

/**
 * Рассчитывает следующий дедлайн для повторяющихся заданий:
 * - 'daily': следующий день в настроенное время (HH:mm)
 * - 'interval_days': через N дней в настроенное время
 * - 'weekdays': следующий выбранный день недели в настроенное время
 * Время всегда учитывается в часовом поясе Астаны (UTC+5).
 */
export function getNextRecurringDeadline(
  currentTimestamp: number,
  type: RecurrenceType = 'daily',
  intervalDays = 1,
  weekdays: number[] = [1, 2, 3, 4, 5],
  recurrenceTime = '23:00'
): number {
  const now = Date.now();
  const astanaOffsetMs = 5 * 3600 * 1000;
  const astanaNow = new Date(now + astanaOffsetMs);
  const curYear = astanaNow.getUTCFullYear();
  const curMonth = astanaNow.getUTCMonth();
  const curDate = astanaNow.getUTCDate();

  // Парсим настраиваемое время обновления
  const [hStr, mStr] = (recurrenceTime || '23:00').split(':');
  const targetHour = parseInt(hStr || '23', 10);
  const targetMinute = parseInt(mStr || '0', 10);

  let targetDayOffset = 1;

  if (type === 'daily') {
    targetDayOffset = 1;
  } else if (type === 'interval_days') {
    targetDayOffset = Math.max(1, intervalDays || 1);
  } else if (type === 'weekdays') {
    const validWeekdays = weekdays && weekdays.length > 0 ? weekdays : [1, 2, 3, 4, 5];
    const currentDayIso = getAstanaDayOfWeek(now);

    targetDayOffset = 1;
    for (let offset = 1; offset <= 7; offset++) {
      let targetDay = (currentDayIso + offset) % 7;
      if (targetDay === 0) targetDay = 7;
      if (validWeekdays.includes(targetDay)) {
        targetDayOffset = offset;
        break;
      }
    }
  }

  // Вычисляем целевой день и время в UTC с учетом смещения Астаны (-5 часов)
  const nextTarget = new Date(Date.UTC(curYear, curMonth, curDate + targetDayOffset));
  return Date.UTC(
    nextTarget.getUTCFullYear(),
    nextTarget.getUTCMonth(),
    nextTarget.getUTCDate(),
    targetHour - 5,
    targetMinute,
    0,
    0
  );
}

/**
 * Проверяет, актуальна ли задача в плане на сегодня («Досуг дня / Задачи на сегодня»):
 */
export function isTaskScheduledForToday(quest: Quest, nowTimestamp = Date.now()): boolean {
  if (quest.isCompleted) return false;

  const todayStr = getAstanaDateString(nowTimestamp);

  // Если задание уже выполнено сегодня в этом цикле — не выводим его в активные на сегодня
  if (quest.lastCompletedDate === todayStr) {
    return false;
  }

  // 1. Повторяющиеся задания
  if (quest.isRecurring) {
    // Если назначен следующий срок в будущем и он не равен сегодняшней дате — задача не на сегодня
    if (quest.nextScheduledDate && quest.nextScheduledDate > nowTimestamp) {
      const nextDateStr = getAstanaDateString(quest.nextScheduledDate);
      if (nextDateStr !== todayStr) {
        return false;
      }
    }

    const recType = quest.recurrenceType || (quest.recurrenceInterval === 'daily' ? 'daily' : 'daily');
    if (recType === 'daily') {
      return true;
    }
    if (recType === 'weekdays') {
      const todayIso = getAstanaDayOfWeek(nowTimestamp);
      const days = quest.recurrenceWeekdays || [1, 2, 3, 4, 5];
      return days.includes(todayIso);
    }
    if (recType === 'interval_days') {
      const deadlineDate = getAstanaDateString(quest.deadlineTimestamp);
      return todayStr === deadlineDate || quest.deadlineTimestamp <= nowTimestamp;
    }
  }

  // 2. Обычные университетские дедлайны:
  const deadlineDate = getAstanaDateString(quest.deadlineTimestamp);
  const isToday = todayStr === deadlineDate;
  const isWithin48h =
    quest.deadlineTimestamp >= nowTimestamp &&
    quest.deadlineTimestamp - nowTimestamp < 48 * 3600 * 1000;

  return isToday || isWithin48h;
}

/**
 * Текстовое описание периодичности с указанием времени обновления
 */
export function getRecurrenceDescription(quest: Quest): string {
  if (!quest.isRecurring) return '';
  const type = quest.recurrenceType || 'daily';
  const timeSuffix = quest.recurrenceTime ? ` в ${quest.recurrenceTime}` : '';

  if (type === 'daily') {
    return `Каждый день${timeSuffix}`;
  }

  if (type === 'interval_days') {
    const d = quest.recurrenceDays || 1;
    if (d === 1) return `Каждый день${timeSuffix}`;
    if (d >= 2 && d <= 4) return `Раз в ${d} дня${timeSuffix}`;
    return `Раз в ${d} дней${timeSuffix}`;
  }

  if (type === 'weekdays') {
    const days = quest.recurrenceWeekdays || [];
    let daysLabel = 'Дни недели';
    if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) {
      daysLabel = 'Пн–Пт';
    } else if (days.length === 3 && [1, 3, 5].every((d) => days.includes(d))) {
      daysLabel = 'Пн, Ср, Пт';
    } else if (days.length === 7) {
      daysLabel = 'Каждый день';
    } else {
      const shortNames = days
        .slice()
        .sort((a, b) => a - b)
        .map((d) => WEEKDAYS.find((w) => w.id === d)?.short)
        .filter(Boolean)
        .join(', ');
      daysLabel = shortNames || 'Дни недели';
    }
    return `${daysLabel}${timeSuffix}`;
  }

  return `Повторяется${timeSuffix}`;
}

/**
 * Рассчитывает штраф согласно правилам дисциплины:
 * - Сон после 23:00: -10 баллов
 * - Пропуск утренней тренировки или бега: -5 баллов
 * - Срыв дедлайна по университетскому заданию: -20 баллов
 */
export function getQuestPenaltyPoints(quest: Quest): number {
  const text = `${quest.cleanTitle} ${quest.courseName} ${quest.description}`.toLowerCase();
  if (text.includes('сон') || text.includes('23:00')) {
    return 10;
  }
  if (text.includes('тренировк') || text.includes('бег') || text.includes('спорт')) {
    return 5;
  }
  return 20; // Университетские задания
}

/**
 * Каталог списания баллов, сбалансированный под недельный бюджет ~200 баллов
 */
export const SPEND_REWARDS: SpendRewardPreset[] = [
  {
    id: 'reward-coffee',
    title: 'Кофе / Любимый напиток',
    description: '15 минут спокойного перерыва и вкусный кофе',
    cost: 15,
    icon: '☕',
  },
  {
    id: 'reward-youtube',
    title: '1 серия сериала / YouTube',
    description: 'Серия аниме, сериал или познавательное видео без угрызений совести',
    cost: 25,
    icon: '🎬',
  },
  {
    id: 'reward-gaming',
    title: '1 час видеоигр',
    description: 'Заслуженная игровая сессия после выполненных заданий',
    cost: 40,
    icon: '🎮',
  },
  {
    id: 'reward-relax-evening',
    title: 'Вечер отдыха & Вкусная еда',
    description: 'Чилл-вечер с пиццей/фастфудом, кино и полная перезагрузка',
    cost: 80,
    icon: '🍕',
  },
  {
    id: 'reward-day-off',
    title: 'Полный выходной от учебы',
    description: 'Один день в неделю без задач и дедлайнов для восстановления сил',
    cost: 140,
    icon: '🏖️',
  },
];

/**
 * Базовые штрафы по умолчанию (с возможностью добавления и редактирования)
 */
export const DEFAULT_PENALTY_RULES: PenaltyRule[] = [
  {
    id: 'penalty-sleep',
    title: 'Сон после 23:00',
    description: 'Сбой режима обходится дорого, так как напрямую бьет по энергии для утренних тренировок.',
    points: 10,
    icon: 'moon',
    isDefault: true,
  },
  {
    id: 'penalty-workout',
    title: 'Пропуск утренней тренировки',
    description: 'Пропуск зарядки, ОФП или разминки перед началом учебного дня.',
    points: 5,
    icon: 'dumbbell',
    isDefault: true,
  },
  {
    id: 'penalty-running',
    title: 'Пропуск бега',
    description: 'Пропуск кардио-пробежки на свежем воздухе в запланированный день.',
    points: 5,
    icon: 'footprints',
    isDefault: true,
  },
  {
    id: 'penalty-deadline',
    title: 'Срыв дедлайна по заданию из университета',
    description: 'Учеба приносит больше всего баллов, поэтому цена прокрастинации здесь самая высокая.',
    points: 20,
    icon: 'graduation',
    isDefault: true,
  },
];

/**
 * Рассчитывает количество баллов за квест заданного ранга в зависимости от недельной балансировки:
 * При цели 200 б. (базовая): S=45, A=40, B=30, C=20, D=15, E=10, F=5.
 * При цели 400 б. (x2): S=90, A=80, B=60, C=40, D=30, E=20, F=10.
 * При увеличении цели баллы за активные (незавершенные) квесты пропорционально масштабируются.
 */
export function getRankPointsForTarget(rank: QuestRank, weeklyTarget: number = 200): number {
  const base = QUEST_RANKS[rank]?.points ?? 30;
  const target = weeklyTarget && weeklyTarget > 0 ? weeklyTarget : 200;
  const multiplier = target / 200;
  return Math.max(1, Math.round(base * multiplier));
}

/**
 * Доступные варианты недельной балансировки баллов
 */
export const WEEKLY_BALANCE_OPTIONS: WeeklyBalanceOption[] = [
  {
    value: 200,
    label: '200 баллов',
    isRecommended: true,
    desc: 'Основной сбалансированный режим (35 б. сон + 40 б. спорт + 125 б. университет)',
  },
  {
    value: 400,
    label: '400 баллов',
    desc: 'Двойная шкала (Ранг S: 90 б., Ранг A: 80 б., Ранг B: 60 б., Ранг F: 10 б.)',
  },
  {
    value: 600,
    label: '600 баллов',
    desc: 'Тройная шкала с ровными круглыми баллами (Ранг S: 135 б., Ранг A: 120 б., Ранг B: 90 б., Ранг F: 15 б.)',
  },
  {
    value: 1000,
    label: '1 000 баллов',
    desc: 'Высокая интенсивность и расширенный список целей (Ранг S: 225 б.)',
  },
  {
    value: 5000,
    label: '5 000 баллов',
    desc: 'Усиленный хардкорный марафон или сессия (Ранг S: 1 125 б.)',
  },
  {
    value: 10000,
    label: '10 000 баллов',
    desc: 'Экстремальная шкала для масштабного трекинга (Ранг S: 2 250 б.)',
  },
];


