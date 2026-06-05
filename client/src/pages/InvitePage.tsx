import { useEffect, useState } from 'react';
import { api } from '../api';
import type { AuthState } from '../App';

export default function InvitePage({ token, onLogin }: { token: string; onLogin: (a: AuthState) => void }) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    api.post('/auth/student-invite', { token })
      .then(res => {
        onLogin({ loggedIn: true, role: 'student', studentId: res.studentId });
        setStatus('success');
        window.history.replaceState({}, '', '/');
      })
      .catch(err => {
        setError(err.message);
        setStatus('error');
      });
  }, [token]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    }}>
      <div style={{
        background: 'white', borderRadius: 16, padding: '2.5rem', textAlign: 'center',
        maxWidth: 380, width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.1)'
      }}>
        {status === 'loading' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
            <h2 style={{ color: '#1e293b' }}>초대 링크 확인 중...</h2>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ color: '#1e293b' }}>로그인 성공!</h2>
            <p style={{ color: '#64748b', marginTop: 8 }}>대시보드로 이동합니다...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
            <h2 style={{ color: '#dc2626' }}>오류</h2>
            <p style={{ color: '#64748b', marginTop: 8 }}>{error}</p>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                marginTop: 16, padding: '0.75rem 1.5rem', background: '#667eea',
                color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer'
              }}
            >
              홈으로
            </button>
          </>
        )}
      </div>
    </div>
  );
}
