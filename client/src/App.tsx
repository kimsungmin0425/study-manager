import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './hooks/useAuthStore';
import Sidebar from './components/shared/Sidebar';
import LoginPage from './pages/LoginPage';
import StudentHome from './pages/student/StudentHome';
import StudyRecord from './pages/student/StudyRecord';
import SleepPage from './pages/student/SleepPage';
import TodosPage from './pages/student/TodosPage';
import TeacherHome from './pages/teacher/TeacherHome';
import GroupsPage from './pages/teacher/GroupsPage';
import GroupDetail from './pages/teacher/GroupDetail';
import StudentDashboard from './pages/teacher/StudentDashboard';
import AnalyticsPage from './pages/teacher/AnalyticsPage';
import MonthlyReport from './pages/teacher/MonthlyReport';
import './styles/global.css';

function ProtectedLayout({ children, role }: { children: React.ReactNode; role?: string }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} replace />;
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}

export default function App() {
  const { user } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} /> : <LoginPage />} />

        <Route path="/student" element={<ProtectedLayout role="student"><StudentHome /></ProtectedLayout>} />
        <Route path="/student/record" element={<ProtectedLayout role="student"><StudyRecord /></ProtectedLayout>} />
        <Route path="/student/sleep" element={<ProtectedLayout role="student"><SleepPage /></ProtectedLayout>} />
        <Route path="/student/todos" element={<ProtectedLayout role="student"><TodosPage /></ProtectedLayout>} />

        <Route path="/teacher" element={<ProtectedLayout role="teacher"><TeacherHome /></ProtectedLayout>} />
        <Route path="/teacher/groups" element={<ProtectedLayout role="teacher"><GroupsPage /></ProtectedLayout>} />
        <Route path="/teacher/groups/:groupId" element={<ProtectedLayout role="teacher"><GroupDetail /></ProtectedLayout>} />
        <Route path="/teacher/student/:studentId" element={<ProtectedLayout role="teacher"><StudentDashboard /></ProtectedLayout>} />
        <Route path="/teacher/student/:studentId/report" element={<ProtectedLayout role="teacher"><MonthlyReport /></ProtectedLayout>} />
        <Route path="/teacher/analytics" element={<ProtectedLayout role="teacher"><AnalyticsPage /></ProtectedLayout>} />

        <Route path="*" element={<Navigate to={user ? (user.role === 'teacher' ? '/teacher' : '/student') : '/login'} />} />
      </Routes>
    </BrowserRouter>
  );
}
