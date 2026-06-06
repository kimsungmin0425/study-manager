import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, Cell } from 'recharts';
import api from '../../utils/api';
import { SUBJECT_COLORS, StudySession, SleepRecord, Todo } from '../../types';
import { formatMinutes, sleepDuration } from '../../utils/helpers';
import { ArrowLeft, Moon, CheckSquare, FileText } from 'lucide-react';

interface DashboardData {
  info: { id: string; name: string; email: string };
  stats: { today: number; week: number; month: number };
  sessions: StudySession[];
  sleep: SleepRecord[];
  todos: Todo[];
  monthly: { month: string; total: number }[];
  subjectStats: { subject: string; total: number; sessions: number }[];
}

export default function StudentDashboard() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'study' | 'sleep' | 'todos'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) {
      api.get(`/groups/student/${studentId}/dashboard`)
        .then(res => setData(res.data))
        .finally(() => setLoading(false));
    }
  }, [studentId]);

  if (loading) return (
    <div style={{ padding: 24 }}>
      {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 100, marginBottom: 16, borderRadius: 20 }} />)}
    </div>
  );

  if (!data) return <div style={{ padding: 24, color: 'var(--text-tertiary)' }}>학생을 찾을 수 없어요</div>;

  const monthlyChart = data.monthly.map(m => ({
    month: m.month.slice(5),
    hours: Math.round(Number(m.total) / 60 * 10) / 10,
  }));

  const subjectTotal = data.subjectStats.reduce((a, s) => a + Number(s.total), 0);
  const avgSleep = data.sleep.length > 0
    ? Math.round(data.sleep.slice(0,7).reduce((a, r) => a + sleepDuration(r.sleep_time, r.wake_time), 0) / data.sleep.slice(0,7).length / 60 * 10) / 10
    : 0;

  const completedTodos = data.todos.filter(t => t.is_completed).length;

  return (
    <div style={{ padding: '0 0 24px' }} className="fade-in">
      <div className="page-header">
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)', fontWeight: 600, fontSize: 14, marginBottom: 12, padding: 0 }}>
          <ArrowLeft size={18} />뒤로
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 50, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>
              {data.info.name.slice(0,1)}
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800 }}>{data.info.name}</h1>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{data.info.email}</p>
            </div>
          </div>
          <button onClick={() => navigate(`/teacher/student/${studentId}/report`)} className="btn btn-primary" style={{ flexShrink: 0 }}>
            <FileText size={16} />
            월간 리포트
          </button>
        </div>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div className="tab-bar">
          {(['overview', 'study', 'sleep', 'todos'] as const).map(tab => (
            <button key={tab} className={`tab-item ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab === 'overview' ? '요약' : tab === 'study' ? '공부' : tab === 'sleep' ? '수면' : '계획'}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                { label: '오늘', value: formatMinutes(Number(data.stats.today)), color: 'var(--primary)' },
                { label: '이번 주', value: formatMinutes(Number(data.stats.week)), color: '#16A34A' },
                { label: '이번 달', value: formatMinutes(Number(data.stats.month)), color: '#D97706' },
              ].map(s => (
                <div key={s.label} className="card" style={{ padding: '14px 10px', textAlign: 'center' }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: s.color }}>{s.value}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {monthlyChart.length > 0 && (
              <div className="card">
                <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>월별 공부시간 (시간)</p>
                <ResponsiveContainer width="100%" height={150}>
                  <AreaChart data={monthlyChart}>
                    <defs>
                      <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                    <YAxis hide />
                    <Tooltip formatter={(v: any) => [`${v}시간`, '공부시간']} contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', fontSize: 12 }} />
                    <Area type="monotone" dataKey="hours" stroke="var(--primary)" strokeWidth={2.5} fill="url(#mg)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {data.subjectStats.length > 0 && (
              <div className="card">
                <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>과목 쏠림 분석 (30일)</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={data.subjectStats.slice(0, 6)} layout="vertical" barSize={16}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="subject" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} width={40} />
                    <Tooltip formatter={(v: any) => [formatMinutes(Number(v)), '공부시간']} contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', fontSize: 12 }} />
                    <Bar dataKey="total" radius={[0,6,6,0]}>
                      {data.subjectStats.slice(0,6).map((s, i) => (
                        <Cell key={i} fill={SUBJECT_COLORS[s.subject] || '#9CA3AF'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                {data.subjectStats.length >= 2 && (Number(data.subjectStats[0].total) / subjectTotal) > 0.6 && (
                  <div style={{ background: '#FEF3C7', borderRadius: 10, padding: '10px 14px', marginTop: 10 }}>
                    <p style={{ fontSize: 12, color: '#92400E' }}>
                      ⚠️ <strong>{data.subjectStats[0].subject}</strong>에 공부 시간이 집중되어 있어요 ({Math.round((Number(data.subjectStats[0].total) / subjectTotal) * 100)}%)
                    </p>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="card" style={{ textAlign: 'center', padding: '20px 12px' }}>
                <Moon size={24} color="#7C3AED" style={{ margin: '0 auto 8px' }} />
                <p style={{ fontWeight: 800, fontSize: 18 }}>{avgSleep}시간</p>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>평균 수면</p>
              </div>
              <div className="card" style={{ textAlign: 'center', padding: '20px 12px' }}>
                <CheckSquare size={24} color="#16A34A" style={{ margin: '0 auto 8px' }} />
                <p style={{ fontWeight: 800, fontSize: 18 }}>{completedTodos}/{data.todos.length}</p>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>할 일 완료</p>
              </div>
            </div>
          </>
        )}

        {activeTab === 'study' && (
          <div className="card">
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>최근 공부 기록</p>
            {data.sessions.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center', padding: '20px' }}>기록 없음</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.sessions.slice(0, 20).map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px', borderRadius: 12, background: 'var(--bg)' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: `${SUBJECT_COLORS[s.subject] || '#9CA3AF'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: SUBJECT_COLORS[s.subject] || '#9CA3AF', flexShrink: 0 }}>
                      {s.subject.slice(0,1)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600 }}>{s.subject} · {s.study_type}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        {formatMinutes(s.duration_minutes)}{s.workbook_name ? ` · ${s.workbook_name}` : ''}{s.accuracy_rate ? ` · ${s.accuracy_rate}%` : ''}
                      </p>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{s.session_date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'sleep' && (
          <>
            {data.sleep.length > 0 && (
              <div className="card">
                <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>수면 패턴</p>
                <ResponsiveContainer width="100%" height={150}>
                  <AreaChart data={[...data.sleep].reverse().slice(-14).map(r => ({
                    date: r.record_date.slice(5),
                    hours: Math.round(sleepDuration(r.sleep_time, r.wake_time) / 60 * 10) / 10,
                  }))}>
                    <defs>
                      <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <YAxis domain={[4,10]} hide />
                    <Tooltip formatter={(v: any) => [`${v}시간`]} contentStyle={{ borderRadius: 10, border: 'none', fontSize: 12 }} />
                    <Area type="monotone" dataKey="hours" stroke="#7C3AED" strokeWidth={2.5} fill="url(#sg)" dot={{ fill: '#7C3AED', r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="card">
              <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>수면 기록</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.sleep.map(r => {
                  const dur = sleepDuration(r.sleep_time, r.wake_time);
                  const quality = dur >= 420 ? '#22C55E' : dur >= 360 ? '#F97316' : '#EF4444';
                  return (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px', borderRadius: 12, background: 'var(--bg)' }}>
                      <div style={{ width: 6, height: 6, borderRadius: 2, background: quality }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 600 }}>{r.record_date}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>취침 {r.sleep_time.slice(0,5)} · 기상 {r.wake_time.slice(0,5)}</p>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 13, color: quality }}>
                        {Math.floor(dur/60)}시간{dur%60 > 0 ? ` ${dur%60}분` : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {activeTab === 'todos' && (
          <div className="card">
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>공부 계획</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.todos.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px', borderRadius: 12, background: 'var(--bg)', opacity: t.is_completed ? 0.65 : 1 }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${t.is_completed ? '#22C55E' : 'var(--border)'}`, background: t.is_completed ? '#22C55E' : 'transparent', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {t.is_completed && <span style={{ color: 'white', fontSize: 9, fontWeight: 900 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, textDecoration: t.is_completed ? 'line-through' : 'none' }}>{t.title}</p>
                    {(t.subject || t.due_date) && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                        {t.subject && <span className="badge badge-blue" style={{ fontSize: 10 }}>{t.subject}</span>}
                        {t.due_date && <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{t.due_date}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {data.todos.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13, padding: 20 }}>계획 없음</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
