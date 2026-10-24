import { Skill } from '../types';

export const INITIAL_SKILLS: Skill[] = [
  {
    id: 'skill-frontend',
    name: 'Frontend Mastery',
    icon: 'Layout',
    color: '#06b6d4', // Cyan
    description: 'Интерфейсы, React, CSS Architecture, DOM, адаптивный дизайн и UX.',
    level: 2,
    exp: 140,
    maxExp: 300,
    courseKeywords: ['front end', 'web tech', 'react', 'css', 'html', 'javascript'],
  },
  {
    id: 'skill-algorithms',
    name: 'Algorithms & DAA',
    icon: 'GitBranch',
    color: '#a855f7', // Purple
    description: 'Графы, динамическое программирование, асимптотическая сложность, жадные алгоритмы.',
    level: 3,
    exp: 210,
    maxExp: 450,
    courseKeywords: ['algorithm', 'daa', 'data structures', 'алгоритм', 'дискрет'],
  },
  {
    id: 'skill-architecture',
    name: 'Software Design Patterns',
    icon: 'Layers',
    color: '#eab308', // Amber/Gold
    description: 'Паттерны проектирования (GoF), SOLID, рефакторинг, слабосвязанная архитектура.',
    level: 2,
    exp: 80,
    maxExp: 300,
    courseKeywords: ['design pattern', 'software design', 'паттерн', 'архитектур'],
  },
  {
    id: 'skill-systems',
    name: 'Operating Systems & Linux',
    icon: 'Cpu',
    color: '#3b82f6', // Blue
    description: 'Управление процессами, POSIX threads, память, виртуализация, ядро ОС.',
    level: 2,
    exp: 260,
    maxExp: 300,
    courseKeywords: ['operating system', 'os', 'linux', 'unix', 'системн'],
  },
  {
    id: 'skill-softskills',
    name: 'Soft Skills & Communication',
    icon: 'MessageSquare',
    color: '#10b981', // Emerald
    description: 'Риторика, публичные защиты технических решений, деловые переговоры, эссе.',
    level: 3,
    exp: 120,
    maxExp: 450,
    courseKeywords: ['language', 'казахск', 'русск', 'soft', 'коммуникац', 'риторик', 'эссе'],
  },
];
