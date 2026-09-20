import { create } from 'zustand';
import { supabase } from './supabase';

export interface Teacher {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
}

export interface Subject {
  id: string;
  nome: string;
}

export interface SchoolClass {
  id: string;
  nome: string;
}

export interface GridSlot {
  id: string;
  dia_semana: string;
  bloco_horario: string;
  professor_id: string | null;
  disciplina: string;
  turma: string;
}

export interface Occurrence {
  id: string;
  data: string;
  bloco_horario: string;
  tipo: 'Falta' | 'Formação' | 'Saída Cedo' | 'Palestra Escolar' | 'Projeto';
  professor_id: string;
  motivo?: string;
}

interface AppStore {
  role: 'professor' | 'gestao';
  selectedTeacherId: string | null;
  teachers: Teacher[];
  subjects: Subject[];
  classes: SchoolClass[];
  grid: GridSlot[];
  occurrences: Occurrence[];
  loading: boolean;
  setRole: (role: 'professor' | 'gestao') => void;
  setSelectedTeacherId: (id: string | null) => void;
  fetchData: () => Promise<void>;
  addTeacher: (teacher: Omit<Teacher, 'id'>) => Promise<void>;
  addOccurrence: (occurrence: Omit<Occurrence, 'id'>) => Promise<void>;
  updateGridSlot: (slot: GridSlot) => Promise<void>;
  deleteOccurrence: (id: string) => Promise<void>;
}

export const useStore = create<AppStore>((set, get) => ({
  role: 'professor',
  selectedTeacherId: null,
  teachers: [],
  subjects: [],
  classes: [],
  grid: [],
  occurrences: [],
  loading: false,

  setRole: (role) => set({ role }),
  setSelectedTeacherId: (id) => set({ selectedTeacherId: id }),

  fetchData: async () => {
    set({ loading: true });
    try {
      const [tRes, gRes, oRes] = await Promise.all([
        supabase.from('professores').select('*').order('nome'),
        supabase.from('grade_horaria').select('*'),
        supabase.from('ocorrencias').select('*').order('data', { ascending: false })
      ]);

      set({
        teachers: tRes.data || [],
        grid: gRes.data || [],
        occurrences: oRes.data || [],
        loading: false
      });
    } catch (error) {
      console.error('Erro ao buscar dados do Supabase:', error);
      set({ loading: false });
    }
  },

  addTeacher: async (teacherData) => {
    try {
      const { error } = await supabase.from('professores').insert([teacherData]);
      if (error) throw error;
      await get().fetchData();
    } catch (error) {
      console.error('Erro ao adicionar professor:', error);
    }
  },

  addOccurrence: async (occurrenceData) => {
    try {
      const { error } = await supabase.from('ocorrencias').insert([occurrenceData]);
      if (error) throw error;
      await get().fetchData();
    } catch (error) {
      console.error('Erro ao lançar ocorrência:', error);
    }
  },

  updateGridSlot: async (slot) => {
    try {
      const { error } = await supabase.from('grade_horaria').upsert([slot]);
      if (error) throw error;
      await get().fetchData();
    } catch (error) {
      console.error('Erro ao atualizar horário:', error);
    }
  },

  deleteOccurrence: async (id) => {
    try {
      const { error } = await supabase.from('ocorrencias').delete().eq('id', id);
      if (error) throw error;
      await get().fetchData();
    } catch (error) {
      console.error('Erro ao deletar ocorrência:', error);
    }
  }
}));

// Carregar dados assim que o app iniciar
if (typeof window !== 'undefined') {
  useStore.getState().fetchData();
}
