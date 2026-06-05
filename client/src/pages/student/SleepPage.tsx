import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import api from '../../utils/api';
import { SleepRecord } from '../../types';
import { sleepDuration, today } from '../../utils/helpers';
import { Moon, Sun, Plus, X } from 'lucide-react';

export default function SleepPage() {
  const [records, setRecords] = useState<SleepRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [sleepTime, setSleepTime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [recordDate, setRecordDate] = useState(today());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/sleep/my').then(res => setRecords(res.data));
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await api.post('/sleep', { sleep_time: sleepTime, wake_time: wakeTime, record_date: recordDate });
      setRecords(prev => {
        const filtered = prev.filter(r => r.record_date !== recordDate);
        return [res.data, ...filtered].sort((a, b) => b.record_date.localeCompare(a.record_date));
      });
      setShowForm(false);
    } finally { setLoading(false); }
  };

  const chartData = [...records].reverse().slice(-14).map(r => ({
    date: r.record_date.slice(5),
    hours: Math.round(sleepDuration(r.sleep_time, r.wake_time) / 60 * 10) / 10,
    sleep: r.sleep_time.slice(0, 5),
    wake: r.wake_time.slice(0, 5),
  }));

  const avgSleep = records.length > 0
    ? Math.round(records.slice(0, 7).reduce((a, r) => a + sleepDuration(r.sleep_time, r.wake_time), 0) / records.slice(0, 7).length / 60 * 10) / 10
    : 0;

  const qualityLabel = avgSleep >= 7 ? { text: '좋음', color: '#22C55E' } : avgSleep >= 6 ? { text: '보통', color: '#F97316' } : { text: '부족', color: '#EF4444' };

  return (
    <div style={{ padding: '0 0 24px' }} className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">수면 기록</h1>
            <p className="page-subtitle">규칙적인 수면이 학습 효율을 높여요</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} />기록 추가
          </button>
        </div>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="card" style={{ padding: '20px 16px', textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <Moon size={20} color="#7C3AED" />
            </div>
            <p style={{ fontSize: 22, fontWeight: 800 }}>{avgSleep}<span style={{ fontSize: 14 }}>시간</span></p>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>평균 수면 (7일)</p>
          </div>
          <div className="card" style={{ padding: '20px 16px', textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${qualityLabel.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <Sun size={20} color={qualityLabel.color} />
            </div>
            <p style={{ fontSize: 22, fontWeight: 800, color: qualityLabel.color }}>{qualityLabel.text}</p>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>수면 상태</p>
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="card">
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>수면 패턴 (2주)</p>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} interval={1} />
                <YAxis domain={[4, 10]} hide />
                <Tooltip
                  formatter={(v: any, name: string) => [`${v}시간`, '수면시간']}
                  contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', fontSize: 12 }}
                />
                <Area type="monotone" dataKey="hours" stroke="#7C3AED" strokeWidth={2.5} fill="url(#sleepGrad)" dot={{ fill: '#7C3AED', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
            {/* 7h reference line annotation */}
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', marginTop: 4 }}>
              권장 수면: 7~9시간
            </p>
          </div>
        )}

        {/* Record list */}
        <div className="card">
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>기록 목록</p>
          {records.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)' }}>
              <Moon size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p>아직 수면 기록이 없어요</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {records.slice(0, 14).map(r => {
                const dur = sleepDuration(r.sleep_time, r.wake_time);
                const hours = Math.floor(dur / 60);
                const mins = dur % 60;
                const quality = dur >= 420 ? '#22C55E' : dur >= 360 ? '#F97316' : '#EF4444';
                return (
                  <div key={r.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px', borderRadius: 12, background: 'var(--bg)',
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: quality, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: 13 }}>{r.record_date}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        취침 {r.sleep_time.slice(0,5)} · 기상 {r.wake_time.slice(0,5)}
                      </p>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: quality }}>
                      {hours}시간{mins > 0 ? ` ${mins}분` : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>수면 기록 추가</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label">날짜</label>
                <input className="input" type="date" value={recordDate} onChange={e => setRecordDate(e.target.value)} />
              </div>
              <div>
                <label className="label">취침 시간</label>
                <input className="input" type="time" value={sleepTime} onChange={e => setSleepTime(e.target.value)} />
              </div>
              <div>
                <label className="label">기상 시간</label>
                <input className="input" type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)} />
              </div>
              <div style={{ background: 'var(--primary-light)', borderRadius: 12, padding: '12px 14px' }}>
                <p style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>
                  수면 시간: {(() => {
                    const d = sleepDuration(sleepTime, wakeTime);
                    return `${Math.floor(d/60)}시간 ${d%60}분`;
                  })()}
                </p>
              </div>
              <button className="btn btn-primary" disabled={loading} onClick={handleSubmit}
                style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15 }}>
                {loading ? '저장 중...' : '저장하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
