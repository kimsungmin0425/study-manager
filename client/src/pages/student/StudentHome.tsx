import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '../../hooks/useAuthStore';
import api from '../../utils/api';
import { Stats, StudySession, SUBJECT_COLORS } from '../../types';
import { formatMinutes, dayLabel, getWeekDates } from '../../utils/helpers';
import { BookOpen, TrendingUp, Target, Plus, ChevronRight, Flame } from 'lucide-react';

export default function StudentHome() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/sessions/stats'),
      api.get('/sessions/my?range=week'),
    ]).then(([statsRes, sessionsRes]) => {
      setStats(statsRes.data);
      setRecent(sessionsRes.data.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  // Fill week data with 0s for missing days
  const weekData = getWeekDates().map(date => {
    const found = stats?.dailyWeek.find(d => d.date === date);
    return {
      date,
      day: dayLabel(date),
      total: found ? Math.round(Number(found.total) / 60 * 10) / 10 : 0,
    };
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? '좋은 아침이에요' : hour < 18 ? '오후도 화이팅' : '오늘도 수고했어요';

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <div className="skeleton" style={{ height: 32, width: 200, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 16, width: 140, marginBottom: 32 }} />
        {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 120, marginBottom: 16, borderRadius: 20 }} />)}
      </div>
    );
  }

  return (
    <div style={{ padding: '0 0 24px' }} className="fade-in">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 4 }}>{greeting} 👋</p>
            <h1 className="page-title">{user?.name}님</h1>
          </div>
          <button onClick={() => navigate('/student/record')} className="btn btn-primary" style={{ marginTop: 4 }}>
            <Plus size={16} />
            기록 추가
          </button>
        </div>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Today summary - Big hero card */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, #4A7CF7 0%, #6366F1 100%)',
          color: 'white', padding: '24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ opacity: 0.8, fontSize: 13, marginBottom: 6 }}>오늘 공부시간</p>
              <p style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1 }}>
                {Math.floor((stats?.today || 0) / 60)}
                <span style={{ fontSize: 20, fontWeight: 600, opacity: 0.8 }}>시간 </span>
                {(stats?.today || 0) % 60}
                <span style={{ fontSize: 20, fontWeight: 600, opacity: 0.8 }}>분</span>
              </p>
              <p style={{ opacity: 0.75, fontSize: 12, marginTop: 8 }}>
                이번 주 {formatMinutes(stats?.week || 0)} 공부 완료
              </p>
            </div>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Flame size={28} color="white" />
            </div>
          </div>

          {/* Mini progress bar */}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.8, marginBottom: 6 }}>
              <span>목표: 8시간</span>
              <span>{Math.round(((stats?.today || 0) / 480) * 100)}%</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.25)', borderRadius: 99 }}>
              <div style={{
                height: '100%', borderRadius: 99,
                background: 'rgba(255,255,255,0.9)',
                width: `${Math.min(((stats?.today || 0) / 480) * 100, 100)}%`,
                transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
              }} />
            </div>
          </div>
        </div>

        {/* Week chart */}
        <div className="card card-clickable" onClick={() => navigate('/student/record')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15 }}>주간 현황</p>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>최근 7일</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontSize: 13 }}>
              <span style={{ fontWeight: 600 }}>자세히</span>
              <ChevronRight size={16} />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={weekData} barSize={28}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <YAxis hide />
              <Tooltip
                formatter={(v: any) => [`${v}시간`, '공부시간']}
                contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', fontSize: 12 }}
              />
              <Bar dataKey="total" fill="var(--primary)" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, background: '#DCFCE7',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px',
            }}>
              <TrendingUp size={20} color="#16A34A" />
            </div>
            <p style={{ fontSize: 20, fontWeight: 800 }}>{formatMinutes(stats?.week || 0)}</p>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>이번 주</p>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, background: '#FEF3C7',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px',
            }}>
              <Target size={20} color="#D97706" />
            </div>
            <p style={{ fontSize: 20, fontWeight: 800 }}>{formatMinutes(stats?.month || 0)}</p>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>이번 달</p>
          </div>
        </div>

        {/* Subject distribution */}
        {stats?.bySubject && stats.bySubject.length > 0 && (
          <div className="card">
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>과목별 분포 (30일)</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={stats.bySubject} dataKey="total" cx="50%" cy="50%" innerRadius={32} outerRadius={55} paddingAngle={3}>
                    {stats.bySubject.map((entry, i) => (
                      <Cell key={i} fill={SUBJECT_COLORS[entry.subject] || '#9CA3AF'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {stats.bySubject.slice(0, 4).map((s, i) => {
                  const total = stats.bySubject.reduce((acc, x) => acc + Number(x.total), 0);
                  const pct = Math.round((Number(s.total) / total) * 100);
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: SUBJECT_COLORS[s.subject] || '#9CA3AF', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, flex: 1, fontWeight: 500 }}>{s.subject}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Recent sessions */}
        {recent.length > 0 && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <p style={{ fontWeight: 700, fontSize: 15 }}>최근 기록</p>
              <button onClick={() => navigate('/student/record')} style={{ fontSize: 13, color: 'var(--primary)', background: 'none', border: 'none', fontWeight: 600 }}>전체 보기</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recent.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: `${SUBJECT_COLORS[s.subject] || '#9CA3AF'}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: SUBJECT_COLORS[s.subject] || '#9CA3AF',
                  }}>
                    {s.subject.slice(0, 1)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 1 }}>{s.subject} · {s.study_type}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                      {s.workbook_name ? `${s.workbook_name} · ` : ''}{formatMinutes(s.duration_minutes)}
                      {s.accuracy_rate ? ` · 정답률 ${s.accuracy_rate}%` : ''}
                    </p>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{s.session_date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {recent.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <BookOpen size={40} color="var(--text-tertiary)" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontWeight: 700, marginBottom: 6 }}>아직 기록이 없어요</p>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 16 }}>오늘의 공부를 기록해볼까요?</p>
            <button onClick={() => navigate('/student/record')} className="btn btn-primary">첫 기록 시작하기</button>
          </div>
        )}
      </div>
    </div>
  );
}
