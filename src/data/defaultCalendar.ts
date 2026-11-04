import { Quest } from '../types';
import { formatToAstanaTime } from '../utils/icsParser';

export const DEFAULT_MOODLE_URL = '';

/**
 * Создает эталонный список заданий согласно недельной балансировке в 200 баллов:
 * - Сон до 23:00: 5 баллов (ежедневно) — 35 за неделю
 * - Утренняя тренировка: 5 баллов (Пн-Пт) — 25 за неделю
 * - Бег: 5 баллов (Пн, Ср, Пт) — 15 за неделю
 * - Университетские задания: 2 задания по 40 баллов, 1 сложное на 45 баллов — 125 за неделю
 * ИТОГО: 200 баллов в неделю
 */
export function getInitialQuests(): Quest[] {
  const now = Date.now();
  const dayMs = 24 * 3600 * 1000;

  // Дедлайн сегодня в 23:00 (Астана UTC+5)
  const todaySleepTime = new Date(now);
  todaySleepTime.setHours(23, 0, 0, 0);
  const sleepDeadline = todaySleepTime.getTime();

  // Дедлайн утренней тренировки сегодня в 10:00
  const workoutTime = new Date(now);
  workoutTime.setHours(10, 0, 0, 0);
  const workoutDeadline = workoutTime.getTime() > now ? workoutTime.getTime() : workoutTime.getTime() + dayMs;

  // Дедлайн бега
  const runningTime = new Date(now);
  runningTime.setHours(20, 0, 0, 0);
  const runningDeadline = runningTime.getTime() > now ? runningTime.getTime() : runningTime.getTime() + dayMs;

  // Университетские дедлайны
  const sdpDeadline = now + 3 * dayMs; // через 3 дня
  const webDeadline = now + 5 * dayMs; // через 5 дней
  const daaDeadline = now + 7 * dayMs; // через 7 дней

  return [
    {
      id: 'habit-sleep-2300',
      summary: 'Сон до 23:00',
      cleanTitle: 'Сон до 23:00',
      description: 'Лечь спать вовремя для полноценного восстановления сил и ясного ума.',
      categories: 'Режим дня',
      courseName: 'Режим дня',
      instructor: 'Здоровье и продуктивность',
      dtStart: new Date(now).toISOString(),
      dtEnd: new Date(sleepDeadline).toISOString(),
      localDeadline: formatToAstanaTime(sleepDeadline),
      deadlineTimestamp: sleepDeadline,
      isCompleted: false,
      linkedSkillId: 'skill-softskills',
      points: 5,
      baseExp: 5,
      difficulty: 'F',
      isCustom: true,
      isRecurring: true,
      recurrenceType: 'daily',
      recurrenceDays: 1,
      recurrenceTime: '23:00',
      completedCount: 0,
      isTodayAgenda: true,
    },
    {
      id: 'habit-morning-workout',
      summary: 'Утренняя тренировка',
      cleanTitle: 'Утренняя тренировка',
      description: 'Разминка, ОФП или зарядка на 20-30 минут перед началом учебного дня.',
      categories: 'Спорт и здоровье',
      courseName: 'Спорт и здоровье',
      instructor: 'Физическая форма',
      dtStart: new Date(now).toISOString(),
      dtEnd: new Date(workoutDeadline).toISOString(),
      localDeadline: formatToAstanaTime(workoutDeadline),
      deadlineTimestamp: workoutDeadline,
      isCompleted: false,
      linkedSkillId: 'skill-softskills',
      points: 5,
      baseExp: 5,
      difficulty: 'F',
      isCustom: true,
      isRecurring: true,
      recurrenceType: 'weekdays',
      recurrenceWeekdays: [1, 2, 3, 4, 5], // Пн-Пт
      recurrenceTime: '09:00',
      completedCount: 0,
      isTodayAgenda: true,
    },
    {
      id: 'habit-running',
      summary: 'Бег на свежем воздухе',
      cleanTitle: 'Бег',
      description: 'Кардио-пробежка 3-5 км на свежем воздухе для выносливости.',
      categories: 'Спорт и здоровье',
      courseName: 'Спорт и здоровье',
      instructor: 'Кардио',
      dtStart: new Date(now).toISOString(),
      dtEnd: new Date(runningDeadline).toISOString(),
      localDeadline: formatToAstanaTime(runningDeadline),
      deadlineTimestamp: runningDeadline,
      isCompleted: false,
      linkedSkillId: 'skill-softskills',
      points: 5,
      baseExp: 5,
      difficulty: 'F',
      isCustom: true,
      isRecurring: true,
      recurrenceType: 'weekdays',
      recurrenceWeekdays: [1, 3, 5], // Пн, Ср, Пт
      recurrenceTime: '08:30',
      completedCount: 0,
      isTodayAgenda: true,
    },
    {
      id: 'task-patterns-sdp',
      summary: 'Лабораторная: Паттерны проектирования (SDP)',
      cleanTitle: 'Лабораторная по Software Design Patterns (SDP)',
      description: 'Сложное задание: реализация и защита структурных паттернов Фасад, Адаптер и Архитектура MVC.',
      categories: 'Software Design Patterns | Кафедра IT',
      courseName: 'Software Design Patterns',
      instructor: 'Кафедра Software Engineering',
      dtStart: new Date(now).toISOString(),
      dtEnd: new Date(sdpDeadline).toISOString(),
      localDeadline: formatToAstanaTime(sdpDeadline),
      deadlineTimestamp: sdpDeadline,
      isCompleted: false,
      linkedSkillId: 'skill-architecture',
      points: 45, // Сложное задание на 45 баллов
      baseExp: 45,
      difficulty: 'S',
      isCustom: false,
      isRecurring: false,
      completedCount: 0,
      isTodayAgenda: true,
    },
    {
      id: 'task-web-spa',
      summary: 'Лабораторная работа: SPA компонент',
      cleanTitle: 'Лабораторная работа: SPA интерфейс',
      description: 'Разработка интерактивного фронтенд компонента с хуками и валидацией.',
      categories: 'WEB Technologies (Front End) | Кафедра IT',
      courseName: 'WEB Technologies',
      instructor: 'Кафедра Web-разработки',
      dtStart: new Date(now).toISOString(),
      dtEnd: new Date(webDeadline).toISOString(),
      localDeadline: formatToAstanaTime(webDeadline),
      deadlineTimestamp: webDeadline,
      isCompleted: false,
      linkedSkillId: 'skill-frontend',
      points: 40, // 40 баллов
      baseExp: 40,
      difficulty: 'A',
      isCustom: false,
      isRecurring: false,
      completedCount: 0,
    },
    {
      id: 'task-daa-graphs',
      summary: 'Практикум: Алгоритмы на графах (Dijkstra)',
      cleanTitle: 'Практикум: Алгоритмы на графах',
      description: 'Реализация алгоритма Дейкстры и защита решения на практическом занятии.',
      categories: 'Algorithms & Data Structures | Кафедра IT',
      courseName: 'Algorithms & Data Structures',
      instructor: 'Кафедра Computer Science',
      dtStart: new Date(now).toISOString(),
      dtEnd: new Date(daaDeadline).toISOString(),
      localDeadline: formatToAstanaTime(daaDeadline),
      deadlineTimestamp: daaDeadline,
      isCompleted: false,
      linkedSkillId: 'skill-algorithms',
      points: 40, // 40 баллов
      baseExp: 40,
      difficulty: 'A',
      isCustom: false,
      isRecurring: false,
      completedCount: 0,
    },
  ];
}

export const DEFAULT_ICS_DATA = `BEGIN:VCALENDAR
METHOD:PUBLISH
PRODID:-//Moodle Pty Ltd//NONSGML Moodle Version//EN
VERSION:2.0
BEGIN:VEVENT
UID:task-patterns-facade-03@moodle
SUMMARY:Лабораторная по Software Design Patterns (SDP)
DESCRIPTION:Сложное задание: реализация и защита структурных паттернов Фасад, Адаптер и Архитектура MVC.
CLASS:PUBLIC
DTSTART:20261109T180000Z
DTEND:20261109T180000Z
CATEGORIES:Software Design Patterns | Кафедра IT
END:VEVENT
BEGIN:VEVENT
UID:task-web-frontend-01@moodle
SUMMARY:Лабораторная работа: SPA интерфейс
DESCRIPTION:Разработка адаптивного интерфейса с использованием компонентов и хуков состояния.
CLASS:PUBLIC
DTSTART:20261105T180000Z
DTEND:20261105T180000Z
CATEGORIES:WEB Technologies (Front End) | Кафедра IT
END:VEVENT
BEGIN:VEVENT
UID:task-daa-graphs-02@moodle
SUMMARY:Практикум: Алгоритмы на графах
DESCRIPTION:Реализация алгоритма Дейкстры и поиска кратчайшего пути. Защита на практическом занятии.
CLASS:PUBLIC
DTSTART:20261107T190000Z
DTEND:20261107T190000Z
CATEGORIES:Algorithms & Data Structures | Кафедра IT
END:VEVENT
END:VCALENDAR`;
