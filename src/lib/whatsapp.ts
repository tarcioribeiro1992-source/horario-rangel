import type { Occurrence, Teacher, SchoolClass } from '@/types';
import { formatBlockTime } from '@/lib/timeBlocks';

const WEEKDAY_MAP: Record<string, string> = {
  segunda: 'Segunda-feira',
  terca: 'Terça-feira',
  quarta: 'Quarta-feira',
  quinta: 'Quinta-feira',
  sexta: 'Sexta-feira',
};

const APP_URL = 'https://horariorangel.vercel.app';

export function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function buildWhatsAppMessage(
  occurrence: Occurrence,
  teacher: Teacher | undefined,
  schoolClass: SchoolClass | undefined,
  substituteTeacher: Teacher | undefined,
): string {
  const teacherName = teacher?.name ?? 'Professor(a)';
  const weekdayName = WEEKDAY_MAP[occurrence.weekday] ?? occurrence.weekday;
  const blockTime = formatBlockTime(occurrence.blockId);
  const className = schoolClass?.name ?? 'N/A';
  const reason = occurrence.note || occurrence.type;

  let message =
    `Olá, Professor(a) ${teacherName}. ` +
    `A Gestão Pedagógica informa que houve uma alteração no seu horário do dia ${weekdayName} ` +
    `(bloco ${occurrence.blockId}, ${blockTime}) referente à turma ${className}, ` +
    `devido a: ${reason} (Tipo: ${occurrence.type}).`;

  if (substituteTeacher) {
    message += `\n\nProfessor(a) substituto(a) designado(a): ${substituteTeacher.name}.`;
  }

  message += `\n\nPor favor, confira sua nova grade atualizada no aplicativo HorárioRangel: ${APP_URL}`;

  return message;
}

export function buildWhatsAppURL(phone: string, message: string): string {
  const sanitized = sanitizePhone(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${sanitized}?text=${encodedMessage}`;
}
