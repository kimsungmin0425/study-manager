import { useState } from 'react';
import { api } from '../api';
import type { AuthState } from '../App';

export default function TeacherLogin({ onLogin }: { onLogin: (a: AuthState) => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/teacher-login', { password });
      onLogin({ loggedIn: true, role: 'teacher' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #0f0c29, #302b63, #24243e)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Noto Sans KR', sans-serif", padding: '1rem'
    }}>
      {/* 배경 장식 */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '10%', left: '15%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '10%', width: 250, height: 250, background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        borderRadius: 24,
        padding: '2.5rem',
        width: '100%', maxWidth: 400,
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        position: 'relative'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 72, height: 72,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            borderRadius: 20, margin: '0 auto 1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, boxShadow: '0 8px 20px rgba(99,102,241,0.4)'
          }}>📚</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'white', marginBottom: 6 }}>학습 관리 시스템</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>선생님 전용 대시보드</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
              style={{
                width: '100%', padding: '0.875rem 1rem',
                background: 'rgba(255,255,255,0.08)',
                border: '1.5px solid rgba(255,255,255,0.1)',
                borderRadius: 12, fontSize: 15, color: 'white',
                outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.8)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10, padding: '0.75rem', color: '#fca5a5', fontSize: 14, marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '0.875rem',
            background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white', border: 'none', borderRadius: 12,
            fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 8px 20px rgba(99,102,241,0.4)',
            transition: 'all 0.2s'
          }}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div style={{
          marginTop: '1.5rem', padding: '1rem',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)',
          textAlign: 'center'
        }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
            학생은 선생님이 보낸 <span style={{ color: 'rgba(139,92,246,0.8)', fontWeight: 600 }}>초대 링크</span>로 접속하세요
          </p>
        </div>
      </div>
    </div>
  );
}
