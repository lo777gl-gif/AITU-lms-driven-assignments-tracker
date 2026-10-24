import { Quest, QuestStatus, SubQuest, QuestRank } from '../types';
import { QUEST_RANKS } from './levelMath';

/**
 * Parses iCalendar date format (e.g. 20261024T185900Z or 20261024T185900)
 * Returns epoch milliseconds timestamp.
 */
export function parseIcsDate(rawDateStr?: string): number {
  if (!rawDateStr) return Date.now() + 7 * 24 * 3600 * 1000;

  const cleanStr = rawDateStr.includes(':') ? rawDateStr.split(':').pop()! : rawDateStr;
  const match = cleanStr.trim().match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?/);

  if (!match) {
    const fallback = Date.parse(cleanStr);
    return isNaN(fallback) ? Date.now() : fallback;
  }

  const [, year, month, day, hour, min, sec, isUtc] = match;
  if (!hour) {
    return Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), 23, 59, 59);
  }

  if (isUtc) {
    return Date.UTC(
      parseInt(year, 10),
      parseInt(month, 10) - 1,
      parseInt(day, 10),
      parseInt(hour, 10),
      parseInt(min, 10),
      parseInt(sec, 10)
    );
  }

  return Date.UTC(
    parseInt(year, 10),
    parseInt(month, 10) - 1,
    parseInt(day, 10),
    parseInt(hour, 10),
    parseInt(min, 10),
    parseInt(sec, 10)
  );
}

/**
 * Formats timestamp to Astana Time (UTC+5)
 */
export function formatToAstanaTime(timestamp: number): string {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Asia/Almaty',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Formats remaining time into human-friendly countdown
 */
export function getRemainingTimeText(deadlineTimestamp: number, isCompleted: boolean): {
  text: string;
  isBurning: boolean;
  isExpired: boolean;
  hoursLeft: number;
} {
  if (isCompleted) {
    return { text: 'Сдано', isBurning: false, isExpired: false, hoursLeft: 999 };
  }

  const now = Date.now();
  const diffMs = deadlineTimestamp - now;

  if (diffMs <= 0) {
    const passedDays = Math.floor(Math.abs(diffMs) / (24 * 3600 * 1000));
    const passedHours = Math.floor((Math.abs(diffMs) % (24 * 3600 * 1000)) / (3600 * 1000));
    return {
      text: passedDays > 0 ? `Просрочено на ${passedDays} д. ${passedHours} ч.` : `Просрочено на ${passedHours} ч.`,
      isBurning: false,
      isExpired: true,
      hoursLeft: diffMs / (3600 * 1000),
    };
  }

  const totalHours = Math.floor(diffMs / (3600 * 1000));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));

  const isBurning = totalHours < 48;

  if (days > 0) {
    return {
      text: `${days} д. ${hours} ч. ${minutes} мин.`,
      isBurning,
      isExpired: false,
      hoursLeft: totalHours,
    };
  }

  if (hours > 0) {
    return {
      text: `${hours} ч. ${minutes} мин.!`,
      isBurning: true,
      isExpired: false,
      hoursLeft: totalHours,
    };
  }

  return {
    text: `${minutes} мин.!`,
    isBurning: true,
    isExpired: false,
    hoursLeft: totalHours,
  };
}

/**
 * Unfolds folded lines in iCalendar per RFC 5545
 */
export function unfoldIcs(rawIcs: string): string {
  return rawIcs.replace(/\r?\n[ \t]/g, '');
}

/**
 * Unescapes RFC 5545 escaped characters
 */
export function unescapeIcsText(str: string): string {
  return str
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

/**
 * Detects skill ID matching course name
 */
export function matchSkillForCourse(courseName: string): string {
  const lower = courseName.toLowerCase();
  if (lower.includes('front end') || lower.includes('web tech') || lower.includes('html') || lower.includes('css')) {
    return 'skill-frontend';
  }
  if (lower.includes('algorithm') || lower.includes('daa') || lower.includes('алгоритм') || lower.includes('data struct')) {
    return 'skill-algorithms';
  }
  if (lower.includes('operating system') || lower.includes('os') || lower.includes('unix') || lower.includes('linux')) {
    return 'skill-systems';
  }
  if (lower.includes('design pattern') || lower.includes('паттерн') || lower.includes('architect') || lower.includes('архитектур')) {
    return 'skill-architecture';
  }
  if (lower.includes('language') || lower.includes('язык') || lower.includes('soft') || lower.includes('коммуникац') || lower.includes('риторик')) {
    return 'skill-softskills';
  }
  return 'skill-general';
}

/**
 * Determines default rank from summary text
 */
export function determineDefaultRank(summary: string): QuestRank {
  const sumLower = summary.toLowerCase();
  if (sumLower.includes('exam') || sumLower.includes('экзамен') || sumLower.includes('финал') || sumLower.includes('диплом')) {
    return 'S';
  }
  if (sumLower.includes('рубежный') || sumLower.includes('midterm') || sumLower.includes('контроль')) {
    return 'A';
  }
  if (sumLower.includes('algorithm') || sumLower.includes('assignment') || sumLower.includes('лабораторн')) {
    return 'B';
  }
  if (sumLower.includes('практик') || sumLower.includes('проект')) {
    return 'C';
  }
  if (sumLower.includes('асинхронные') || sumLower.includes('эссе')) {
    return 'D';
  }
  return 'C';
}

/**
 * Parses raw iCalendar text into Quest objects
 */
export function parseMoodleIcs(
  icsContent: string,
  existingQuestsMap: Record<string, Quest> = {},
  deletedIdsSet: Set<string> = new Set()
): Quest[] {
  const unfolded = unfoldIcs(icsContent);
  const lines = unfolded.split(/\r?\n/);

  const quests: Quest[] = [];
  let inEvent = false;
  let currentEvent: Record<string, string> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {};
      continue;
    }

    if (line === 'END:VEVENT') {
      inEvent = false;
      const uid = currentEvent['UID'] || `quest-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

      // If user explicitly deleted this quest previously, do not resurrect it
      if (deletedIdsSet.has(uid)) {
        continue;
      }

      const summary = currentEvent['SUMMARY'] || 'Безымянное задание';
      const description = unescapeIcsText(currentEvent['DESCRIPTION'] || '');
      const categories = currentEvent['CATEGORIES'] || 'Академический курс';

      let courseName = categories;
      let instructor = '';
      if (categories.includes('|')) {
        const parts = categories.split('|');
        courseName = parts[0].trim();
        instructor = parts[1].trim();
      }

      const dtStartRaw = currentEvent['DTSTART'] || currentEvent['DTEND'];
      const dtEndRaw = currentEvent['DTEND'] || currentEvent['DTSTART'];
      const deadlineTimestamp = parseIcsDate(dtEndRaw);

      const cleanTitle = summary
        .replace(/\s+is\s+due/gi, '')
        .replace(/\s+closes/gi, ' (Дедлайн)')
        .replace(/\s+opens/gi, ' (Открытие)');

      const existing = existingQuestsMap[uid];

      // Configurable rank (S, A, B, C, D, E, F)
      const rank: QuestRank = existing?.difficulty || determineDefaultRank(summary);
      const baseExp = existing?.baseExp || QUEST_RANKS[rank].exp;

      const defaultSubquests: SubQuest[] = existing?.subquests?.length
        ? existing.subquests
        : [
            {
              id: `${uid}-sub-1`,
              text: 'Изучить требования задания и методические материалы',
              isCompleted: false,
              exp: 20,
            },
            {
              id: `${uid}-sub-2`,
              text: 'Выполнить практическую часть и оформить решение',
              isCompleted: false,
              exp: 25,
            },
            {
              id: `${uid}-sub-3`,
              text: 'Сдать отчет и загрузить файл в систему Moodle',
              isCompleted: false,
              exp: 20,
            },
          ];

      const linkedSkillId = existing?.linkedSkillId || matchSkillForCourse(courseName);

      const quest: Quest = {
        id: uid,
        summary,
        cleanTitle,
        description,
        categories,
        courseName,
        instructor,
        dtStart: new Date(parseIcsDate(dtStartRaw)).toISOString(),
        dtEnd: new Date(deadlineTimestamp).toISOString(),
        localDeadline: formatToAstanaTime(deadlineTimestamp),
        deadlineTimestamp,
        isCompleted: existing ? existing.isCompleted : false,
        completedAt: existing ? existing.completedAt : undefined,
        subquests: defaultSubquests,
        linkedSkillId,
        baseExp,
        difficulty: rank,
        isCustom: existing?.isCustom || false,
      };

      quests.push(quest);
      continue;
    }

    if (inEvent) {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const keyWithParams = line.substring(0, colonIdx);
        const val = line.substring(colonIdx + 1);
        const key = keyWithParams.split(';')[0].toUpperCase();
        currentEvent[key] = val;
      }
    }
  }

  quests.sort((a, b) => a.deadlineTimestamp - b.deadlineTimestamp);
  return quests;
}

/**
 * Computes live quest status
 */
export function getQuestStatus(quest: Quest): QuestStatus {
  if (quest.isCompleted) return 'completed';
  const now = Date.now();
  if (quest.deadlineTimestamp < now) return 'failed';
  if (quest.deadlineTimestamp - now < 48 * 3600 * 1000) return 'burning';
  return 'active';
}
