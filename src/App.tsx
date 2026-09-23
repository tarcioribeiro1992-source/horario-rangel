import { useState } from 'react';
import { ToastProvider } from '@/components/Toast';
import { Layout, type AdminView } from '@/components/Layout';
import { CalendarView } from '@/components/CalendarView';
import { StatsView } from '@/components/StatsView';
import { TeachersView } from '@/components/TeachersView';
import { SubjectsView } from '@/components/SubjectsView';
import { ClassesView } from '@/components/ClassesView';
import { GridView } from '@/components/GridView';
import { EmailsView } from '@/components/EmailsView';
import { TeacherDashboard } from '@/components/TeacherDashboard';
import { ClassDashboard } from '@/components/ClassDashboard';
import { useStore } from '@/lib/store';

function AppContent() {
  const store = useStore();
  const [adminView, setAdminView] = useState<AdminView>('calendario');

  let content;
  if (store.role === 'professor') {
    content = <TeacherDashboard store={store} />;
  } else {
    switch (adminView) {
      case 'calendario':
        content = <CalendarView store={store} />;
        break;
      case 'estatisticas':
        content = <StatsView store={store} />;
        break;
      case 'professores':
        content = <TeachersView store={store} />;
        break;
      case 'disciplinas':
        content = <SubjectsView store={store} />;
        break;
      case 'turmas':
        content = <ClassesView store={store} />;
        break;
      case 'horario-turmas':
        content = <ClassDashboard store={store} />;
        break;
      case 'grade':
        content = <GridView store={store} />;
        break;
      case 'emails':
        content = <EmailsView store={store} />;
        break;
    }
  }

  return (
    <Layout store={store} adminView={adminView} setAdminView={setAdminView}>
      {content}
    </Layout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
