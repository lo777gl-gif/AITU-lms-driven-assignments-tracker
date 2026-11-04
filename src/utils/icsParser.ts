import { Quest, QuestStatus, QuestRank } from '../types';
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
 * Formats date into YYYY-MM-DDTHH:mm string for <input type="datetime-local">
 * adjusted to local Astana timezone (UTC+5)
 */
export function timestampToDateTimeLocal(timestamp: number): string {
  const date = new Date(timestamp);
  // Astana is UTC+5 (300 minutes offset from UTC)
  const astanaOffsetMs = 5 * 60 * 60 * 1000;
  const localDate = new Date(date.getTime() + astanaOffsetMs);
  const iso = localDate.toISOString(); // YYYY-MM-DDTHH:mm:ss.sssZ
  return iso.substring(0, 16);
}

/**
 * Converts a <input type="datetime-local"> string back to UTC epoch ms
 * assuming the user input is in Astana time (UTC+5)
 */
export function dateTimeLocalToTimestamp(localStr: string): number {
  if (!localStr) return Date.now();
  // localStr is "YYYY-MM-DDTHH:mm"
  const [datePart, timePart] = localStr.split('T');
  if (!datePart || !timePart) return Date.now();
  const [y, m, d] = datePart.split('-').map(Number);
  const [h, min] = timePart.split(':').map(Number);
  // Subtract 5 hours for Astana UTC+5
  return Date.UTC(y, m - 1, d, h - 5, min, 0);
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
  return 'skill-frontend';
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
      const rawDeadlineTimestamp = parseIcsDate(dtEndRaw);

      const rawCleanTitle = summary
        .replace(/\s+is\s+due/gi, '')
        .replace(/\s+closes/gi, ' (Дедлайн)')
        .replace(/\s+opens/gi, ' (Открытие)');

      const existing = existingQuestsMap[uid];

      // If user edited title, description, course, or deadline, preserve custom values!
      const cleanTitle = existing?.cleanTitle || rawCleanTitle;
      const finalCourseName = existing?.courseName || courseName;
      const finalDescription = existing?.description !== undefined ? existing.description : description;
      const deadlineTimestamp = existing?.deadlineTimestamp || rawDeadlineTimestamp;

      // Configurable rank (S, A, B, C, D, E, F) and points
      const rank: QuestRank = existing?.difficulty || determineDefaultRank(summary);
      const points = existing?.points || QUEST_RANKS[rank]?.points || 40;

      const linkedSkillId = existing?.linkedSkillId || matchSkillForCourse(courseName);

      const quest: Quest = {
        id: uid,
        summary,
        cleanTitle,
        description: finalDescription,
        categories,
        courseName: finalCourseName,
        instructor,
        dtStart: new Date(parseIcsDate(dtStartRaw)).toISOString(),
        dtEnd: new Date(deadlineTimestamp).toISOString(),
        localDeadline: formatToAstanaTime(deadlineTimestamp),
        deadlineTimestamp,
        isCompleted: existing ? existing.isCompleted : false,
        completedAt: existing ? existing.completedAt : undefined,
        linkedSkillId,
        points,
        baseExp: points,
        difficulty: rank,
        isCustom: existing?.isCustom || false,
        isRecurring: existing?.isRecurring || false,
        recurrenceType: existing?.recurrenceType || (existing?.recurrenceInterval === 'daily' ? 'daily' : undefined),
        recurrenceDays: existing?.recurrenceDays,
        recurrenceWeekdays: existing?.recurrenceWeekdays,
        completedCount: existing?.completedCount || 0,
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

/**
 * Merges newly parsed LMS quests with existing quests so that:
 * 1. ALL previously created/custom tasks (isCustom: true, habit-*, custom-quest-*, or any user-created tasks) are preserved.
 * 2. Pre-existing tasks that are not present in the current LMS feed remain untouched (unless previously deleted by user).
 * 3. Deleted tasks (deletedIdsSet) are never revived.
 * 4. Existing tasks that match an LMS event (by ID or by title+course) are updated with current LMS schedule/links while preserving user-customized points, difficulty, notes, completion status, and linked skills.
 * 5. Incoming new LMS tasks are added.
 */
export function mergeQuestsWithLms(
  existingQuests: Quest[],
  lmsQuests: Quest[],
  deletedIdsSet: Set<string> = new Set()
): Quest[] {
  // Exclude any task that user previously deleted
  const filteredExisting = existingQuests.filter((q) => !deletedIdsSet.has(q.id));

  // Build lookup maps for fast matching
  const existingById = new Map<string, Quest>();
  const existingByKey = new Map<string, Quest>();

  filteredExisting.forEach((q) => {
    existingById.set(q.id, q);
    const key = `${(q.cleanTitle || '').trim().toLowerCase()}|||${(q.courseName || '').trim().toLowerCase()}`;
    existingByKey.set(key, q);
  });

  const mergedList: Quest[] = [];
  const processedExistingIds = new Set<string>();

  // Process incoming LMS items
  for (const lmsQ of lmsQuests) {
    if (deletedIdsSet.has(lmsQ.id)) {
      continue;
    }

    const key = `${(lmsQ.cleanTitle || '').trim().toLowerCase()}|||${(lmsQ.courseName || '').trim().toLowerCase()}`;
    const existing = existingById.get(lmsQ.id) || existingByKey.get(key);

    if (existing) {
      processedExistingIds.add(existing.id);

      // Preserve existing user state & properties
      mergedList.push({
        ...lmsQ,
        id: existing.id,
        cleanTitle: existing.cleanTitle || lmsQ.cleanTitle,
        description:
          existing.description !== undefined && existing.description !== ''
            ? existing.description
            : lmsQ.description,
        courseName: existing.courseName || lmsQ.courseName,
        isCompleted: existing.isCompleted,
        completedAt: existing.completedAt,
        lastCompletedDate: existing.lastCompletedDate,
        nextScheduledDate: existing.nextScheduledDate,
        completedCount: existing.completedCount || 0,
        linkedSkillId: existing.linkedSkillId !== undefined ? existing.linkedSkillId : lmsQ.linkedSkillId,
        points: existing.points || lmsQ.points,
        baseExp: existing.baseExp || lmsQ.baseExp,
        difficulty: existing.difficulty || lmsQ.difficulty,
        isCustom: existing.isCustom,
        isRecurring: existing.isRecurring,
        recurrenceType: existing.recurrenceType,
        recurrenceInterval: existing.recurrenceInterval,
        recurrenceDays: existing.recurrenceDays,
        recurrenceWeekdays: existing.recurrenceWeekdays,
        recurrenceTime: existing.recurrenceTime,
        isTodayAgenda: existing.isTodayAgenda,
        isPenalized: existing.isPenalized,
        // Schedule: if user manually edited the quest or if LMS provides fresh timestamp, update
        deadlineTimestamp: lmsQ.deadlineTimestamp || existing.deadlineTimestamp,
        localDeadline: lmsQ.localDeadline || existing.localDeadline,
        dtStart: lmsQ.dtStart || existing.dtStart,
        dtEnd: lmsQ.dtEnd || existing.dtEnd,
      });
    } else {
      // Brand new LMS quest
      mergedList.push(lmsQ);
    }
  }

  // CRITICAL: Preserve ALL previously existing tasks that were not in the LMS feed!
  // This guarantees user-created tasks, habits, and any prior assignments NEVER disappear!
  for (const q of filteredExisting) {
    if (!processedExistingIds.has(q.id)) {
      mergedList.push(q);
    }
  }

  // Sort by deadline timestamp
  mergedList.sort((a, b) => a.deadlineTimestamp - b.deadlineTimestamp);
  return mergedList;
}

