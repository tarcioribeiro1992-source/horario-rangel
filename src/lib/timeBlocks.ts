import type { TimeBlock, Weekday } from '@/types';

export const TIME_BLOCKS: TimeBlock[] = [
  { id: 1, label: '1º Horário', start: '07:30', end: '08:20', isBreak: false },
  { id: 2, label: '2º Horário', start: '08:20', end: '09:10', isBreak: false },
  { id: 3, label: 'Intervalo (Lanche da Manhã)', start: '09:10', end: '09:30', isBreak: true },
  { id: 4, label: '3º Horário', start: '09:30', end: '10:20', isBreak: false },
  { id: 5, label: '4º Horário', start: '10:20', end: '11:10', isBreak: false },
  { id: 6, label: '5º Horário', start: '11:10', end: '12:00', isBreak: false },
  { id: 7, label: 'Intervalo (Almoço)', start: '12:00', end: '13:30', isBreak: true },
  { id: 8, label: '6º Horário', start: '13:30', end: '14:20', isBreak: false },
  { id: 9, label: '7º Horário', start: '14:20', end: '15:10', isBreak: false },
  { id: 10, label: 'Intervalo (Lanche da Tarde)', start: '15:10', end: '15:30', isBreak: true },
  { id: 11, label: '8º Horário', start: '15:30', end: '16:20', isBreak: false },
  { id: 12, label: '9º Horário', start: '16:20', end: '17:00', isBreak: false },
];

export const TEACHING_BLOCK_IDS = TIME_BLOCKS.filter((b) => !b.isBreak).map((b) => b.id);

export const WEEKDAYS: { key: Weekday; short: string; full: string }[] = [
  { key: 'segunda', short: 'Seg', full: 'Segunda-feira' },
  { key: 'terca', short: 'Ter', full: 'Terça-feira' },
  { key: 'quarta', short: 'Qua', full: 'Quarta-feira' },
  { key: 'quinta', short: 'Qui', full: 'Quinta-feira' },
  { key: 'sexta', short: 'Sex', full: 'Sexta-feira' },
];

export function getBlockByNumber(num: number): TimeBlock | undefined {
  const teachingBlocks = TIME_BLOCKS.filter((b) => !b.isBreak);
  return teachingBlocks.find((b) => b.id === num);
}

export function getBlockById(id: number): TimeBlock | undefined {
  return TIME_BLOCKS.find((b) => b.id === id);
}

export function formatBlockTime(blockId: number): string {
  const block = getBlockById(blockId);
  if (!block) return '';
  return `${block.start}–${block.end}`;
}
