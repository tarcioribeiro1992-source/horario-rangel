import type {
  Teacher,
  Subject,
  SchoolClass,
  GridSlot,
  Occurrence,
  EmailLog,
} from '@/types';

export const SEED_TEACHERS: Teacher[] = [
  { id: 't1', name: 'Ana Carolina Souza', email: 'ana.souza@horariorangel.edu.br', color: '#0EA5E9' },
  { id: 't2', name: 'Bruno Martins', email: 'bruno.martins@horariorangel.edu.br', color: '#10B981' },
  { id: 't3', name: 'Carla Fernandes', email: 'carla.fernandes@horariorangel.edu.br', color: '#F59E0B' },
  { id: 't4', name: 'Diego Ramos', email: 'diego.ramos@horariorangel.edu.br', color: '#EF4444' },
  { id: 't5', name: 'Eduarda Lima', email: 'eduarda.lima@horariorangel.edu.br', color: '#8B5CF6' },
  { id: 't6', name: 'Felipe Castro', email: 'felipe.castro@horariorangel.edu.br', color: '#EC4899' },
  { id: 't7', name: 'Gabriela Nunes', email: 'gabriela.nunes@horariorangel.edu.br', color: '#14B8A6' },
  { id: 't8', name: 'Henrique Alves', email: 'henrique.alves@horariorangel.edu.br', color: '#F97316' },
];

export const SEED_SUBJECTS: Subject[] = [
  { id: 's1', name: 'Matemática', color: '#0EA5E9' },
  { id: 's2', name: 'Português', color: '#10B981' },
  { id: 's3', name: 'História', color: '#F59E0B' },
  { id: 's4', name: 'Geografia', color: '#EF4444' },
  { id: 's5', name: 'Ciências', color: '#8B5CF6' },
  { id: 's6', name: 'Inglês', color: '#EC4899' },
  { id: 's7', name: 'Educação Física', color: '#14B8A6' },
  { id: 's8', name: 'Artes', color: '#F97316' },
];

export const SEED_CLASSES: SchoolClass[] = [
  { id: 'c1', name: '6º A', grade: '6º ano' },
  { id: 'c2', name: '6º B', grade: '6º ano' },
  { id: 'c3', name: '7º A', grade: '7º ano' },
  { id: 'c4', name: '7º B', grade: '7º ano' },
  { id: 'c5', name: '8º A', grade: '8º ano' },
  { id: 'c6', name: '9º A', grade: '9º ano' },
];

function slot(
  weekday: 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta',
  blockId: number,
  teacherId: string,
  subjectId: string,
  classId: string,
): GridSlot {
  return { id: `${weekday}-${blockId}-${teacherId}-${classId}`, weekday, blockId, teacherId, subjectId, classId };
}

export const SEED_GRID: GridSlot[] = [
  // Segunda-feira
  slot('segunda', 1, 't1', 's1', 'c1'),
  slot('segunda', 2, 't1', 's1', 'c1'),
  slot('segunda', 4, 't2', 's2', 'c3'),
  slot('segunda', 5, 't3', 's3', 'c5'),
  slot('segunda', 6, 't4', 's4', 'c2'),
  slot('segunda', 8, 't5', 's5', 'c4'),
  slot('segunda', 9, 't6', 's6', 'c6'),
  slot('segunda', 11, 't7', 's7', 'c1'),
  slot('segunda', 12, 't8', 's8', 'c3'),
  // Terça-feira
  slot('terca', 1, 't2', 's2', 'c2'),
  slot('terca', 2, 't3', 's3', 'c4'),
  slot('terca', 4, 't1', 's1', 'c5'),
  slot('terca', 5, 't5', 's5', 'c1'),
  slot('terca', 6, 't6', 's6', 'c3'),
  slot('terca', 8, 't7', 's7', 'c6'),
  slot('terca', 9, 't8', 's8', 'c2'),
  slot('terca', 11, 't4', 's4', 'c4'),
  slot('terca', 12, 't1', 's1', 'c6'),
  // Quarta-feira
  slot('quarta', 1, 't3', 's3', 'c1'),
  slot('quarta', 2, 't4', 's4', 'c3'),
  slot('quarta', 4, 't5', 's5', 'c5'),
  slot('quarta', 5, 't6', 's6', 'c2'),
  slot('quarta', 6, 't7', 's7', 'c4'),
  slot('quarta', 8, 't8', 's8', 'c6'),
  slot('quarta', 9, 't1', 's1', 'c1'),
  slot('quarta', 11, 't2', 's2', 'c3'),
  slot('quarta', 12, 't3', 's3', 'c5'),
  // Quinta-feira
  slot('quinta', 1, 't4', 's4', 'c2'),
  slot('quinta', 2, 't5', 's5', 'c4'),
  slot('quinta', 4, 't6', 's6', 'c1'),
  slot('quinta', 5, 't7', 's7', 'c3'),
  slot('quinta', 6, 't8', 's8', 'c5'),
  slot('quinta', 8, 't1', 's1', 'c6'),
  slot('quinta', 9, 't2', 's2', 'c2'),
  slot('quinta', 11, 't3', 's3', 'c4'),
  slot('quinta', 12, 't4', 's4', 'c1'),
  // Sexta-feira
  slot('sexta', 1, 't5', 's5', 'c3'),
  slot('sexta', 2, 't6', 's6', 'c5'),
  slot('sexta', 4, 't7', 's7', 'c1'),
  slot('sexta', 5, 't8', 's8', 'c2'),
  slot('sexta', 6, 't1', 's1', 'c4'),
  slot('sexta', 8, 't2', 's2', 'c6'),
  slot('sexta', 9, 't3', 's3', 'c1'),
  slot('sexta', 11, 't4', 's4', 'c3'),
  slot('sexta', 12, 't5', 's5', 'c5'),
];

export const SEED_OCCURRENCES: Occurrence[] = [
  {
    id: 'o1',
    weekday: 'segunda',
    blockId: 1,
    teacherId: 't1',
    classId: 'c1',
    type: 'Falta',
    note: 'Licença médica',
    substituteTeacherId: 't3',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'o2',
    weekday: 'terca',
    blockId: 4,
    teacherId: 't2',
    classId: 'c3',
    type: 'Formação',
    note: 'Curso de capacitação pedagógica',
    substituteTeacherId: null,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'o3',
    weekday: 'quarta',
    blockId: 8,
    teacherId: 't5',
    classId: 'c4',
    type: 'Saída Cedo',
    note: 'Consulta médica',
    substituteTeacherId: 't7',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'o4',
    weekday: 'segunda',
    blockId: 8,
    teacherId: 't5',
    classId: 'c4',
    type: 'Palestra Escolar',
    note: 'Palestra sobre sustentabilidade',
    substituteTeacherId: null,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'o5',
    weekday: 'quinta',
    blockId: 6,
    teacherId: 't8',
    classId: 'c5',
    type: 'Projeto',
    note: 'Feira de ciências',
    substituteTeacherId: null,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'o6',
    weekday: 'terca',
    blockId: 11,
    teacherId: 't4',
    classId: 'c4',
    type: 'Falta',
    note: 'Problema familiar',
    substituteTeacherId: 't6',
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
];

export const SEED_EMAIL_LOGS: EmailLog[] = [];
