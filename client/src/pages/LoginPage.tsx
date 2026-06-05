import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../hooks/useAuthStore';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const { login, register, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'login') {
        await login(email, password);
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        navigate(user.role === 'teacher' ? '/teacher' : '/student');
      } else {
        await register(name, email, password, role);
        navigate(role === 'teacher' ? '/teacher' : '/student');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)', padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(74,124,247,0.35)',
          }}>
            <GraduationCap size={32} color="white" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>StudyFlow</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 14 }}>
            {mode === 'login' ? '다시 만나서 반가워요 👋' : '함께 성장해요 🌱'}
          </p>
        </div>

        <div className="card" style={{ padding: '28px 24px' }}>
          {/* Mode toggle */}
          <div className="tab-bar" style={{ marginBottom: 24 }}>
            <button className={`tab-item ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>로그인</button>
            <button className={`tab-item ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>회원가입</button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mode === 'register' && (
              <>
                <div>
                  <label className="label">이름</label>
                  <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="홍길동" required />
                </div>
                <div>
                  <label className="label">역할</label>
                  <div className="tab-bar">
                    <button type="button" className={`tab-item ${role === 'student' ? 'active' : ''}`} onClick={() => setRole('student')}>학생</button>
                    <button type="button" className={`tab-item ${role === 'teacher' ? 'active' : ''}`} onClick={() => setRole('teacher')}>선생님</button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="label">이메일</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" required />
            </div>

            <div>
              <label className="label">비밀번호</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-tertiary)',
                }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 14px', borderRadius: 10, fontSize: 13 }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, marginTop: 4 }}>
              {loading ? '처리 중...' : mode === 'login' ? '로그인' : '시작하기'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
