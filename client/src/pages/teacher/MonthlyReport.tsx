import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../utils/api';
import { SUBJECT_COLORS } from '../../types';
import { formatMinutes, sleepDuration } from '../../utils/helpers';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function MonthlyReport() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (studentId) {
      api.get(`/groups/student/${studentId}/dashboard`)
        .then(res => setData(res.data))
        .finally(() => setLoading(false));
    }
  }, [studentId]);

  const downloadPDF = async () => {
    if (!reportRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${data.info.name}_월간리포트_${new Date().toISOString().slice(0,7)}.pdf`);
    } catch (err) {
      alert('PDF 생성에 실패했습니다');
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>불러오는 중...</div>;
  if (!data) return <div style={{ padding: 24 }}>학생을 찾을 수 없어요</div>;

  const monthMinutes = Number(data.stats.month);
  const avgDaily = Math.round(monthMinutes / 30);
  const totalSessions = data.sessions.length;
  const avgSleep = data.sleep.length > 0
    ? Math.round(data.sleep.slice(0, 30).reduce((a: number, r: any) => a + sleepDuration(r.sleep_time, r.wake_time), 0) / data.sleep.slice(0, 30).length / 60 * 10) / 10
    : 0;
  const completedTodos = data.todos.filter((t: any) => t.is_completed).length;
  const todoRate = data.todos.length > 0 ? Math.round((completedTodos / data.todos.length) * 100) : 0;

  const subjectTotal = data.subjectStats.reduce((a: number, s: any) => a + Number(s.total), 0);
  const today = new Date();
  const reportMonth = `${today.getFullYear()}년 ${today.getMonth() + 1}월`;

  return (
    <div style={{ padding: '0 0 24px', background: '#F7F8FA', minHeight: '100vh' }} className="fade-in">
      {/* Top Bar */}
      <div style={{ padding: '20px 24px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)', fontWeight: 600, fontSize: 14, padding: 0 }}>
          <ArrowLeft size={18} />뒤로
        </button>
        <button onClick={downloadPDF} disabled={downloading} className="btn btn-primary">
          <Download size={16} />
          {downloading ? 'PDF 생성 중...' : 'PDF 다운로드'}
        </button>
      </div>

      {/* Report Content */}
      <div ref={reportRef} style={{
        maxWidth: 800, margin: '0 auto', padding: 40,
        background: 'white', borderRadius: 12,
      }}>
        {/* Header */}
        <div style={{ borderBottom: '3px solid var(--primary)', paddingBottom: 20, marginBottom: 30 }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 6 }}>월간 학습 리포트</p>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>{data.info.name} 학생</h1>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)' }}>{reportMonth}</p>
        </div>

        {/* Summary Stats */}
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--primary)' }}>📊 이번 달 요약</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 32 }}>
          {[
            { label: '총 공부시간', value: formatMinutes(monthMinutes), color: 'var(--primary)' },
            { label: '일평균', value: formatMinutes(avgDaily), color: '#16A34A' },
            { label: '학습 세션', value: `${totalSessions}회`, color: '#D97706' },
            { label: '평균 수면', value: `${avgSleep}h`, color: '#7C3AED' },
          ].map(s => (
            <div key={s.label} style={{ background: '#F9FAFB', padding: 16, borderRadius: 10, textAlign: 'center' }}>
              <p style={{ fontSize: 20, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</p>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Subject Distribution */}
        {data.subjectStats.length > 0 && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--primary)' }}>📚 과목별 학습 시간</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.subjectStats} dataKey="total" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2}>
                      {data.subjectStats.map((entry: any, i: number) => (
                        <Cell key={i} fill={SUBJECT_COLORS[entry.subject] || '#9CA3AF'} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <table style={{ width: '100%', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <th style={{ textAlign: 'left', padding: '8px 4px', color: 'var(--text-secondary)', fontWeight: 600 }}>과목</th>
                      <th style={{ textAlign: 'right', padding: '8px 4px', color: 'var(--text-secondary)', fontWeight: 600 }}>시간</th>
                      <th style={{ textAlign: 'right', padding: '8px 4px', color: 'var(--text-secondary)', fontWeight: 600 }}>비율</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.subjectStats.slice(0, 8).map((s: any, i: number) => {
                      const pct = Math.round((Number(s.total) / subjectTotal) * 100);
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                          <td style={{ padding: '8px 4px' }}>
                            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: SUBJECT_COLORS[s.subject] || '#9CA3AF', marginRight: 6 }} />
                            {s.subject}
                          </td>
                          <td style={{ textAlign: 'right', padding: '8px 4px', fontWeight: 600 }}>{formatMinutes(Number(s.total))}</td>
                          <td style={{ textAlign: 'right', padding: '8px 4px', color: 'var(--text-secondary)' }}>{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Imbalance warning */}
            {data.subjectStats.length >= 2 && (Number(data.subjectStats[0].total) / subjectTotal) > 0.6 && (
              <div style={{ background: '#FEF3C7', borderRadius: 10, padding: '12px 16px', marginBottom: 24, borderLeft: '4px solid #F59E0B' }}>
                <p style={{ fontSize: 13, color: '#92400E', fontWeight: 600 }}>
                  💡 학습 균형 점검: <strong>{data.subjectStats[0].subject}</strong>에 학습 시간이 집중되어 있어요 ({Math.round((Number(data.subjectStats[0].total) / subjectTotal) * 100)}%). 다른 과목과의 균형을 권장해요.
                </p>
              </div>
            )}
          </>
        )}

        {/* Monthly Trend */}
        {data.monthly.length > 0 && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--primary)' }}>📈 월별 추세</h2>
            <div style={{ height: 200, marginBottom: 32 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthly.map((m: any) => ({ month: m.month.slice(5) + '월', hours: Math.round(Number(m.total) / 60 * 10) / 10 }))}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => [`${v}시간`]} />
                  <Bar dataKey="hours" fill="var(--primary)" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* Sleep & Todo */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
          <div style={{ background: '#F9FAFB', padding: 20, borderRadius: 10 }}>
            <h3 style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12, fontWeight: 600 }}>🌙 수면 패턴</h3>
            <p style={{ fontSize: 24, fontWeight: 800, color: '#7C3AED', marginBottom: 4 }}>{avgSleep}시간</p>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              {avgSleep >= 7 ? '✅ 충분한 수면' : avgSleep >= 6 ? '⚠️ 다소 부족' : '⛔ 수면 부족'}
            </p>
          </div>
          <div style={{ background: '#F9FAFB', padding: 20, borderRadius: 10 }}>
            <h3 style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12, fontWeight: 600 }}>✅ 계획 달성률</h3>
            <p style={{ fontSize: 24, fontWeight: 800, color: '#16A34A', marginBottom: 4 }}>{todoRate}%</p>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{completedTodos} / {data.todos.length}개 완료</p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 16, marginTop: 32 }}>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center' }}>
            StudyFlow 월간 리포트 · 생성일: {today.toLocaleDateString('ko-KR')}
          </p>
        </div>
      </div>
    </div>
  );
}
