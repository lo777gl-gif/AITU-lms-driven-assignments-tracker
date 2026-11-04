import { Skill } from '../types';

export const INITIAL_SKILLS: Skill[] = [
  {
    id: 'skill-frontend',
    name: 'Frontend Development',
    icon: 'Layout',
    color: '#06b6d4', // Cyan
    description: 'Интерфейсы, React, CSS, DOM, адаптивный дизайн и веб-технологии.',
    points: 240,
    courseKeywords: ['front end', 'web tech', 'react', 'css', 'html', 'javascript'],
  },
  {
    id: 'skill-algorithms',
    name: 'Algorithms & DAA',
    icon: 'GitBranch',
    color: '#a855f7', // Purple
    description: 'Графы, динамическое программирование, структуры данных, асимптотическая сложность.',
    points: 350,
    courseKeywords: ['algorithm', 'daa', 'data structures', 'алгоритм', 'дискрет'],
  },
  {
    id: 'skill-architecture',
    name: 'Software Architecture & Patterns',
    icon: 'Layers',
    color: '#eab308', // Amber
    description: 'Паттерны проектирования (GoF), SOLID, архитектура систем и рефакторинг.',
    points: 180,
    courseKeywords: ['design pattern', 'software design', 'паттерн', 'архитектур'],
  },
  {
    id: 'skill-systems',
    name: 'Operating Systems & Linux',
    icon: 'Cpu',
    color: '#3b82f6', // Blue
    description: 'Управление процессами, POSIX threads, память, виртуализация, ядро ОС.',
    points: 290,
    courseKeywords: ['operating system', 'os', 'linux', 'unix', 'системн'],
  },
  {
    id: 'skill-softskills',
    name: 'Communication & Presentations',
    icon: 'MessageSquare',
    color: '#10b981', // Emerald
    description: 'Публичные защиты проектов, деловые переговоры, эссе и техническая документация.',
    points: 160,
    courseKeywords: ['language', 'казахск', 'русск', 'soft', 'коммуникац', 'риторик', 'эссе'],
  },
];
