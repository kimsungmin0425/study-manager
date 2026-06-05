import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import api from '../../utils/api';
import { StudySession, STUDY_TYPES, SUBJECTS, SUBJECT_COLORS } from '../../types';
import { formatMinutes, dayLabel, getWeekDates, today } from '../../utils/helpers';
import { Plus, Trash2, ChevronDown, ChevronUp, X } from 'lucide-react';

type RangeType = 'today' | 'week' | 'month';

export default function StudyRecord() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [range, setRange] = useState<RangeType>('week');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [subject, setSubject] = useState('수학');
  const [studyType, setStudyType] = useState('문제 풀이');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);
  const [workbook, setWorkbook] = useState('');
  const [accuracy, setAccuracy] = useState('');
  const [note, setNote] = useState('');
  const [sessionDate, setSessionDate] = useState(today());

  const fetchSessions = async () => {
    const res = await api.get(`/sessions/my?range=${range}`);
    setSessions(res.data);
  };

  useEffect(() => { fetchSessions(); }, [range]);

  const handleSubmit = async () => {
    const total = hours * 60 + minutes;
    if (total === 0) return alert('공부 시간을 입력해주세요');
    setLoading(true);
    try {
      await api.post('/sessions', {
        subject, study_type: studyType,
        duration_minutes: total,
        workbook_name: workbook || undefined,
        accuracy_rate: accuracy ? Number(accuracy) : undefined,
        note: note || undefined,
        session_date: sessionDate,
      });
      setShowForm(false);
      setWorkbook(''); setAccuracy(''); setNote(''); setHours(0); setMinutes(30);
      fetchSessions();
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('삭제할까요?')) return;
    await api.delete(`/sessions/${id}`);
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const totalMins = sessions.reduce((a, s) => a + s.duration_minutes, 0);

  // Group by date for chart
  const chartData = (() => {
    const map: Record<string, number> = {};
    sessions.forEach(s => { map[s.session_date] = (map[s.session_date] || 0) + s.duration_minutes; });
    return Object.entries(map).sort(([a],[b]) => a > b ? 1 : -1).map(([date, total]) => ({
      day: dayLabel(date),
      date,
      total: Math.round(total / 60 * 10) / 10,
    }));
  })();

  return (
    <div style={{ padding: '0 0 24px' }} className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">공부 기록</h1>
            <p className="page-subtitle">총 {formatMinutes(totalMins)}</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} />기록 추가
          </button>
        </div>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Range tabs */}
        <div className="tab-bar">
          {(['today', 'week', 'month'] as RangeType[]).map(r => (
            <button key={r} className={`tab-item ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>
              {r === 'today' ? '오늘' : r === 'week' ? '이번 주' : '이번 달'}
            </button>
          ))}
        </div>

        {/* Chart */}
        {chartData.length > 0 && range !== 'today' && (
          <div className="card">
            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: 'var(--text-secondary)' }}>일별 공부시간 (시간)</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={chartData} barSize={24}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <YAxis hide />
                <Tooltip formatter={(v: any) => [`${v}시간`]} contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', fontSize: 12 }} />
                <Bar dataKey="total" fill="var(--primary)" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Session list */}
        <div className="card">
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
            {sessions.length}개의 기록
          </p>
          {sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-tertiary)' }}>
              <p style={{ fontSize: 14 }}>기록이 없어요</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sessions.map(s => (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '12px', borderRadius: 12, background: 'var(--bg)',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: `${SUBJECT_COLORS[s.subject] || '#9CA3AF'}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, fontWeight: 800, color: SUBJECT_COLORS[s.subject] || '#9CA3AF',
                  }}>
                    {s.subject.slice(0,1)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{s.subject}</span>
                      <span className="badge badge-blue" style={{ fontSize: 11 }}>{s.study_type}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
                      {formatMinutes(s.duration_minutes)}
                      {s.workbook_name && ` · ${s.workbook_name}`}
                      {s.accuracy_rate && ` · 정답률 ${s.accuracy_rate}%`}
                    </p>
                    {s.note && <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{s.note}</p>}
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3 }}>{s.session_date}</p>
                  </div>
                  <button onClick={() => handleDelete(s.id)} className="btn-ghost" style={{
                    background: 'none', border: 'none', padding: '4px',
                    color: 'var(--text-tertiary)', flexShrink: 0,
                  }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add modal */}
      {showForm && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>공부 기록 추가</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label">날짜</label>
                <input className="input" type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} />
              </div>

              <div>
                <label className="label">과목</label>
                <select className="input" value={subject} onChange={e => setSubject(e.target.value)}>
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="label">공부 유형</label>
                <select className="input" value={studyType} onChange={e => setStudyType(e.target.value)}>
                  {STUDY_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="label">공부 시간</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select className="input" value={hours} onChange={e => setHours(Number(e.target.value))}>
                    {Array.from({length: 13}, (_,i) => <option key={i} value={i}>{i}시간</option>)}
                  </select>
                  <select className="input" value={minutes} onChange={e => setMinutes(Number(e.target.value))}>
                    {[0,5,10,15,20,25,30,35,40,45,50,55].map(m => <option key={m} value={m}>{m}분</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">문제집 (선택)</label>
                <input className="input" value={workbook} onChange={e => setWorkbook(e.target.value)} placeholder="예: 수학의 정석" />
              </div>

              <div>
                <label className="label">정답률 (선택)</label>
                <div style={{ position: 'relative' }}>
                  <input className="input" type="number" min="0" max="100" value={accuracy} onChange={e => setAccuracy(e.target.value)} placeholder="0 ~ 100" style={{ paddingRight: 36 }} />
                  <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text-tertiary)' }}>%</span>
                </div>
              </div>

              <div>
                <label className="label">메모 (선택)</label>
                <textarea className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="오늘의 공부 메모..." rows={2} style={{ resize: 'none' }} />
              </div>

              <button className="btn btn-primary" disabled={loading} onClick={handleSubmit}
                style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, marginTop: 4 }}>
                {loading ? '저장 중...' : '저장하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
