import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../hooks/useAuthStore';
import {
  LayoutDashboard, BookOpen, Moon, CheckSquare,
  Users, BarChart2, LogOut, GraduationCap
} from 'lucide-react';

const studentNav = [
  { to: '/student', label: '홈', icon: LayoutDashboard, exact: true },
  { to: '/student/record', label: '공부 기록', icon: BookOpen },
  { to: '/student/sleep', label: '수면 기록', icon: Moon },
  { to: '/student/todos', label: '공부 계획', icon: CheckSquare },
];

const teacherNav = [
  { to: '/teacher', label: '대시보드', icon: LayoutDashboard, exact: true },
  { to: '/teacher/groups', label: '그룹 관리', icon: Users },
  { to: '/teacher/analytics', label: '분석', icon: BarChart2 },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const nav = user?.role === 'teacher' ? teacherNav : studentNav;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      {/* Desktop sidebar */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 240,
        background: '#fff', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', zIndex: 50,
        padding: '0',
      }} className="desktop-sidebar">
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--primary)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <GraduationCap size={20} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.3px' }}>StudyFlow</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                {user?.role === 'teacher' ? '선생님' : '학생'}
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 12px' }}>
          {nav.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, marginBottom: 2,
                fontSize: 14, fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                background: isActive ? 'var(--primary-light)' : 'transparent',
                transition: 'all 0.15s',
                textDecoration: 'none',
              })}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border-light)' }}>
          <div style={{ padding: '10px 12px', marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>{user?.email}</div>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start' }}>
            <LogOut size={16} />
            로그아웃
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav style={{
        display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#fff', borderTop: '1px solid var(--border)',
        zIndex: 50, padding: '8px 0 env(safe-area-inset-bottom)',
      }} className="mobile-nav">
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {nav.map(({ to, label, icon: Icon, exact }) => (
            <NavLink key={to} to={to} end={exact}
              style={({ isActive }) => ({
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 2, padding: '6px 12px', textDecoration: 'none',
                color: isActive ? 'var(--primary)' : 'var(--text-tertiary)',
                fontSize: 10, fontWeight: isActive ? 700 : 400,
              })}>
              <Icon size={22} />
              {label}
            </NavLink>
          ))}
          <button onClick={handleLogout} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 2, padding: '6px 12px', background: 'none', border: 'none',
            color: 'var(--text-tertiary)', fontSize: 10,
          }}>
            <LogOut size={22} />
            나가기
          </button>
        </div>
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-nav { display: block !important; }
        }
      `}</style>
    </>
  );
}
