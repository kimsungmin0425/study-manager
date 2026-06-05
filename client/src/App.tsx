import { useState, useEffect } from 'react';
import { api } from './api';
import TeacherLogin from './pages/TeacherLogin';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import InvitePage from './pages/InvitePage';

export type AuthState = {
  loggedIn: boolean;
  role: 'teacher' | 'student' | null;
  studentId?: number;
  name?: string;
};

export default function App() {
  const [auth, setAuth] = useState<AuthState>({ loggedIn: false, role: null });
  const [loading, setLoading] = useState(true);

  const path = window.location.pathname;

  useEffect(() => {
    api.get('/auth/me').then(setAuth).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📚</div>
        <p style={{ color: '#64748b' }}>로딩 중...</p>
      </div>
    </div>
  );

  // 초대 링크 페이지
  if (path.startsWith('/invite/')) {
    const token = path.split('/invite/')[1];
    return <InvitePage token={token} onLogin={setAuth} />;
  }

  // 학생 대시보드
  if (auth.loggedIn && auth.role === 'student') {
    return <StudentDashboard auth={auth} onLogout={() => {
      api.post('/auth/logout', {}).then(() => setAuth({ loggedIn: false, role: null }));
    }} />;
  }

  // 선생님 대시보드
  if (auth.loggedIn && auth.role === 'teacher') {
    return <TeacherDashboard onLogout={() => {
      api.post('/auth/logout', {}).then(() => setAuth({ loggedIn: false, role: null }));
    }} />;
  }

  // 로그인 페이지
  return <TeacherLogin onLogin={setAuth} />;
}
