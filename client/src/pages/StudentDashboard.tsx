import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import type { AuthState } from '../App';

// ── 상수 ──────────────────────────────────────────
const SUBJECTS = ['수학','영어','국어','과학','사회','물리','화학','생물','지구과학','역사','한국사','제2외국어','독서','기타'];

const STUDY_TYPES = [
  { value: 'new_problems',    label: '신규 문제풀이',  icon: '📝' },
  { value: 'review_problems', label: '복습 문제풀이',  icon: '🔁' },
  { value: 'concept',         label: '개념 학습',      icon: '📖' },
  { value: 'concept_review',  label: '개념 복습',      icon: '🔄' },
  { value: 'wrong_note',      label: '오답노트 정리',  icon: '❌' },
  { value: 'memorize',        label: '암기',           icon: '🧠' },
  { value: 'lecture',         label: '강의 수강',      icon: '🎧' },
  { value: 'mock_exam',       label: '모의고사',       icon: '📋' },
  { value: 'reading',         label: '독서',           icon: '📚' },
  { value: 'other',           label: '기타',           icon: '✏️' },
];

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#84cc16','#f97316','#14b8a6'];

const C = {
  bg: '#f8faff', primary: '#6366f1', text: '#0f172a',
  muted: '#64748b', border: '#e2e8f0', success: '#10b981',
  warning: '#f59e0b', danger: '#ef4444',
};

// ── 유틸 ──────────────────────────────────────────
const fmt = (m: number) => {
  if (!m) return '0분';
  const h = Math.floor(m/60), min = m%60;
  return h > 0 ? `${h}시간 ${min}분` : `${min}분`;
};

const todayStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });

// "HH:MM" → 오늘 날짜 기준 ISO string (KST)
const timeToISO = (date: string, time: string) => {
  return `${date}T${time}:00+09:00`;
};

// ISO → "오전/오후 H:MM"
const fmtTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Seoul' });
};

const getStudyType = (v: string) => STUDY_TYPES.find(t => t.value === v) || STUDY_TYPES[9];

type Session = {
  id: number; subject: string; content?: string; study_type: string;
  start_time: string; end_time: string; duration_minutes: number;
  satisfaction?: string; problem_count?: number; correct_count?: number; workbook_name?: string;
};
type Plan = { id: number; subject: string; study_type: string; description?: string; target_duration?: number; is_completed: boolean };

// ── CSS ──────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Noto Sans KR',sans-serif;background:${C.bg};color:${C.text};}
button,input,select,textarea{font-family:inherit;}
.app{min-height:100vh;padding-bottom:2rem;}
.header{background:white;padding:.875rem 1.25rem;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;border-bottom:1px solid ${C.border};box-shadow:0 2px 8px rgba(0,0,0,.04);}
.tabs{display:flex;gap:6px;overflow-x:auto;padding:.75rem 1.25rem;background:white;border-bottom:1px solid ${C.border};}
.tabs::-webkit-scrollbar{display:none;}
.tab{padding:.5rem .875rem;border-radius:10px;border:none;font-size:13px;font-weight:700;white-space:nowrap;cursor:pointer;transition:all .2s;}
.tab.on{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;box-shadow:0 3px 8px rgba(99,102,241,.3);}
.tab.off{background:${C.bg};color:${C.muted};border:1.5px solid ${C.border};}
.container{padding:1rem 1.25rem;max-width:600px;margin:0 auto;}
.card{background:white;border-radius:16px;padding:1.25rem;margin-bottom:1rem;border:1px solid ${C.border};box-shadow:0 2px 8px rgba(0,0,0,.04);}
.inp{width:100%;padding:.75rem 1rem;border:1.5px solid ${C.border};border-radius:12px;font-size:15px;outline:none;background:${C.bg};transition:all .2s;}
.inp:focus{border-color:${C.primary};box-shadow:0 0 0 3px rgba(99,102,241,.1);background:white;}
.sel{width:100%;padding:.75rem 1rem;border:1.5px solid ${C.border};border-radius:12px;font-size:14px;outline:none;background:white;appearance:none;cursor:pointer;}
.btn{width:100%;padding:.875rem;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(99,102,241,.3);transition:all .2s;}
.btn:disabled{opacity:.6;cursor:not-allowed;}
.btn-green{width:100%;padding:.875rem;background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(16,185,129,.3);}
.btn-sm{padding:.4rem .875rem;background:#eef2ff;color:#6366f1;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;}
.btn-ghost{background:none;border:1.5px solid ${C.border};border-radius:10px;padding:.625rem 1rem;color:${C.muted};font-size:14px;font-weight:600;cursor:pointer;}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;}
.label{font-size:13px;font-weight:600;color:${C.muted};margin-bottom:5px;display:block;}
.hero{background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:20px;padding:1.5rem;margin-bottom:1rem;color:white;box-shadow:0 8px 24px rgba(99,102,241,.35);}
.session-card{padding:1rem;background:${C.bg};border-radius:12px;margin-bottom:8px;border-left:3px solid ${C.primary};}
.badge{display:inline-flex;align-items:center;gap:3px;padding:3px 8px;border-radius:999px;font-size:12px;font-weight:700;}
.badge-purple{background:#eef2ff;color:#6366f1;}
.badge-green{background:#d1fae5;color:#065f46;}
.badge-orange{background:#fef3c7;color:#92400e;}
.badge-red{background:#fee2e2;color:#991b1b;}
.bar-bg{height:8px;background:#e2e8f0;border-radius:4px;margin-top:6px;}
.bar{height:8px;border-radius:4px;transition:width .5s ease;}
.plan-item{display:flex;align-items:center;gap:10px;padding:.875rem;background:white;border-radius:12px;margin-bottom:8px;border:1.5px solid ${C.border};box-shadow:0 2px 4px rgba(0,0,0,.04);}
.plan-done{display:flex;align-items:center;gap:10px;padding:.875rem;background:#f0fdf4;border-radius:12px;margin-bottom:8px;border:1.5px solid #bbf7d0;opacity:.85;}
.toast{background:#0f172a;color:white;border-radius:12px;padding:.75rem 1rem;font-size:14px;margin-bottom:1rem;display:flex;align-items:center;gap:8px;}
.time-row{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;margin-bottom:10px;}
.type-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-bottom:10px;}
.type-btn{padding:.625rem;border-radius:10px;border:1.5px solid ${C.border};background:white;font-size:13px;font-weight:600;cursor:pointer;text-align:left;display:flex;align-items:center;gap:6px;transition:all .2s;}
.type-btn.selected{border-color:${C.primary};background:#eef2ff;color:${C.primary};}
.stat-mini{text-align:center;padding:.75rem .5rem;background:${C.bg};border-radius:12px;}
.divider{height:1px;background:${C.border};margin:1rem 0;}
`;

// ── 메인 컴포넌트 ──────────────────────────────────
export default function StudentDashboard({ auth, onLogout }: { auth: AuthState; onLogout: () => void }) {
  const [tab, setTab] = useState<'today'|'record'|'plan'|'weekly'|'monthly'|'subject'>('today');
  const [profile, setProfile] = useState<any>(null);
  const [selDate, setSelDate] = useState(todayStr());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [weekly, setWeekly] = useState<any[]>([]);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [subjectStats, setSubjectStats] = useState<any[]>([]);
  const [sleep, setSleep] = useState<any>(null);
  const [todayTotal, setTodayTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editSession, setEditSession] = useState<Session|null>(null);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [bedTime, setBedTime] = useState('');
  const [wakeTime, setWakeTime] = useState('');
  const [editName, setEditName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // 폼 상태
  const emptyForm = { subject:'', studyType:'new_problems', startHour:'', startMin:'', endHour:'', endMin:'', content:'', workbookName:'', problemCount:'', correctCount:'', satisfaction:'' };
  const [form, setForm] = useState(emptyForm);
  const emptyPlan = { subject:'', studyType:'new_problems', description:'', targetDuration:'' };
  const [planForm, setPlanForm] = useState(emptyPlan);

  const toast = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };
  const nowKST = () => new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul' });

  const loadSessions = useCallback(async () => {
    const data = await api.get(`/student/sessions?date=${selDate}`);
    setSessions(data);
    setTodayTotal(data.reduce((s: number, x: Session) => s + x.duration_minutes, 0));
  }, [selDate]);

  const loadAll = useCallback(async () => {
    try {
      const [prof, sl, pl] = await Promise.all([
        api.get('/student/profile'),
        api.get(`/student/sleep?date=${selDate}`),
        api.get(`/student/plans?date=${selDate}`),
      ]);
      setProfile(prof);
      if (sl) { setSleep(sl); setBedTime(sl.bed_time||''); setWakeTime(sl.wake_time||''); }
      else { setSleep(null); setBedTime(''); setWakeTime(''); }
      setPlans(pl);
    } catch {}
  }, [selDate]);

  const loadStats = useCallback(async () => {
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth()+1;
    try {
      const [wk, mo, subj] = await Promise.all([
        api.get('/student/weekly'),
        api.get(`/student/monthly?year=${y}&month=${m}`),
        api.get(`/student/subject-stats?year=${y}&month=${m}`),
      ]);
      setWeekly(wk); setMonthly(mo); setSubjectStats(subj);
    } catch {}
  }, []);

  useEffect(() => { loadSessions(); loadAll(); }, [selDate]);
  useEffect(() => { loadStats(); }, []);

  // 세션 제출
  const submitSession = async () => {
    if (!form.subject || !form.studyType || !form.startHour || !form.startMin || !form.endHour || !form.endMin) {
      toast('⚠️ 과목, 유형, 시작/종료 시간을 모두 입력하세요'); return;
    }
    const startPad = `${form.startHour.padStart(2,'0')}:${form.startMin.padStart(2,'0')}`;
    const endPad = `${form.endHour.padStart(2,'0')}:${form.endMin.padStart(2,'0')}`;
    const startISO = timeToISO(selDate, startPad);
    const endISO = timeToISO(selDate, endPad);
    const dur = Math.round((new Date(endISO).getTime() - new Date(startISO).getTime()) / 60000);
    if (dur <= 0) { toast('⚠️ 종료 시간이 시작 시간보다 늦어야 합니다'); return; }

    setLoading(true);
    try {
      const body = {
        subject: form.subject, studyType: form.studyType,
        startTime: startISO, endTime: endISO,
        content: form.content || undefined,
        workbookName: form.workbookName || undefined,
        problemCount: form.problemCount ? parseInt(form.problemCount) : undefined,
        correctCount: form.correctCount ? parseInt(form.correctCount) : undefined,
        satisfaction: form.satisfaction || undefined,
      };
      if (editSession) {
        await api.patch(`/student/sessions/${editSession.id}`, body);
        toast('✅ 수정되었습니다');
      } else {
        await api.post('/student/sessions', body);
        toast('✅ 기록이 추가되었습니다');
      }
      setShowForm(false); setEditSession(null); setForm(emptyForm);
      loadSessions(); loadStats();
    } catch (e: any) { toast('❌ ' + e.message); }
    setLoading(false);
  };

  const startEdit = (s: Session) => {
    const st = new Date(s.start_time);
    const en = new Date(s.end_time);
    const toKSTHM = (d: Date) => ({
      h: d.toLocaleString('ko-KR', { hour: '2-digit', hour12: false, timeZone: 'Asia/Seoul' }).replace('시','').trim(),
      m: d.toLocaleString('ko-KR', { minute: '2-digit', timeZone: 'Asia/Seoul' }).replace('분','').trim().padStart(2,'0'),
    });
    const { h: sh, m: sm } = toKSTHM(st);
    const { h: eh, m: em } = toKSTHM(en);
    setForm({ subject: s.subject, studyType: s.study_type, startHour: sh, startMin: sm, endHour: eh, endMin: em, content: s.content||'', workbookName: s.workbook_name||'', problemCount: s.problem_count?.toString()||'', correctCount: s.correct_count?.toString()||'', satisfaction: s.satisfaction||'' });
    setEditSession(s); setShowForm(true);
  };

  const deleteSession = async (id: number) => {
    if (!confirm('삭제할까요?')) return;
    await api.delete(`/student/sessions/${id}`);
    loadSessions(); loadStats(); toast('🗑 삭제되었습니다');
  };

  const saveSleep = async () => {
    await api.post('/student/sleep', { date: selDate, bedTime, wakeTime, memo: '' });
    toast('✅ 취침/기상 시간이 저장되었습니다');
  };

  const addPlan = async () => {
    if (!planForm.subject) { toast('⚠️ 과목을 입력하세요'); return; }
    await api.post('/student/plans', { date: selDate, subject: planForm.subject, studyType: planForm.studyType, description: planForm.description, targetDuration: planForm.targetDuration ? parseInt(planForm.targetDuration) : undefined });
    setPlanForm(emptyPlan); setShowPlanForm(false);
    const data = await api.get(`/student/plans?date=${selDate}`);
    setPlans(data); toast('✅ 계획이 추가되었습니다');
  };

  const completePlan = async (id: number) => {
    await api.patch(`/student/plans/${id}/complete`, {});
    const data = await api.get(`/student/plans?date=${selDate}`); setPlans(data);
  };

  const displayName = profile?.name || auth.name || '학생';
  const achievementRate = plans.length > 0 ? Math.round(plans.filter(p=>p.is_completed).length/plans.length*100) : 0;
  const todaySubjects: Record<string,number> = {};
  sessions.forEach(s => { todaySubjects[s.subject] = (todaySubjects[s.subject]||0) + s.duration_minutes; });
  const weeklyTotal = weekly.reduce((s,x)=>s+parseInt(x.minutes||0),0);
  const monthlyTotal = monthly.reduce((s,x)=>s+parseInt(x.minutes||0),0);

  // ── 공부 기록 폼 ──────────────────────────────────
  const SessionForm = () => (
    <div style={{ background: C.bg, borderRadius: 14, padding: '1.25rem', border: `1.5px solid ${C.border}`, marginBottom: '1rem' }}>
      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: '1rem' }}>
        {editSession ? '✏️ 기록 수정' : '+ 공부 기록 추가'}
      </div>

      {/* 과목 */}
      <div style={{ marginBottom: 10 }}>
        <label className="label">과목 *</label>
        <select className="sel" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}>
          <option value="">과목 선택</option>
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* 공부 유형 */}
      <div style={{ marginBottom: 10 }}>
        <label className="label">공부 유형 *</label>
        <div className="type-grid">
          {STUDY_TYPES.map(t => (
            <button key={t.value} className={`type-btn ${form.studyType===t.value?'selected':''}`}
              onClick={() => setForm({...form, studyType: t.value})}>
              <span>{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 시간 입력 */}
      <div style={{ marginBottom: 10 }}>
        <label className="label">시간 *</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
            <input className="inp" type="number" min="0" max="23" placeholder="시" value={form.startHour}
              onChange={e => setForm({...form, startHour: e.target.value})}
              style={{ textAlign: 'center', padding: '.75rem .5rem' }} />
            <span style={{ fontWeight: 700, color: C.muted }}>:</span>
            <input className="inp" type="number" min="0" max="59" placeholder="분" value={form.startMin}
              onChange={e => setForm({...form, startMin: e.target.value})}
              style={{ textAlign: 'center', padding: '.75rem .5rem' }} />
          </div>
          <span style={{ fontWeight: 700, color: C.muted, flexShrink: 0 }}>~</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
            <input className="inp" type="number" min="0" max="23" placeholder="시" value={form.endHour}
              onChange={e => setForm({...form, endHour: e.target.value})}
              style={{ textAlign: 'center', padding: '.75rem .5rem' }} />
            <span style={{ fontWeight: 700, color: C.muted }}>:</span>
            <input className="inp" type="number" min="0" max="59" placeholder="분" value={form.endMin}
              onChange={e => setForm({...form, endMin: e.target.value})}
              style={{ textAlign: 'center', padding: '.75rem .5rem' }} />
          </div>
          <button onClick={() => {
            const t = nowKST().split(':');
            setForm({...form, endHour: t[0], endMin: t[1]});
          }} style={{ background: '#eef2ff', border: 'none', borderRadius: 8, padding: '.5rem .625rem', color: C.primary, fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>지금</button>
        </div>
        <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>24시간 형식 (예: 오전 8시 → 8, 오후 2시 → 14)</p>
      </div>

      {/* 문제집/내용 */}
      <div style={{ marginBottom: 10 }}>
        <label className="label">공부 내용 메모</label>
        <input className="inp" placeholder="예: 수능완성 미적분 15~20번" value={form.content}
          onChange={e => setForm({...form, content: e.target.value})} />
      </div>

      {/* 문제집 관련 (문제풀이/오답 유형일 때) */}
      {['new_problems','review_problems','wrong_note','mock_exam'].includes(form.studyType) && (
        <>
          <div style={{ marginBottom: 10 }}>
            <label className="label">문제집 이름</label>
            <input className="inp" placeholder="예: 수능완성, 마더텅, EBS 수능특강" value={form.workbookName}
              onChange={e => setForm({...form, workbookName: e.target.value})} />
          </div>
          <div className="grid2">
            <div>
              <label className="label">푼 문제 수</label>
              <input className="inp" type="number" placeholder="예: 20" value={form.problemCount}
                onChange={e => setForm({...form, problemCount: e.target.value})} />
            </div>
            <div>
              <label className="label">맞은 문제 수</label>
              <input className="inp" type="number" placeholder="예: 17" value={form.correctCount}
                onChange={e => setForm({...form, correctCount: e.target.value})} />
            </div>
          </div>
        </>
      )}

      {/* 만족도 */}
      <div style={{ marginBottom: 12 }}>
        <label className="label">학습 만족도</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['high','😊 상'],['mid','😐 중'],['low','😔 하']].map(([v,l]) => (
            <button key={v} onClick={() => setForm({...form, satisfaction: v})} style={{
              flex: 1, padding: '.625rem', borderRadius: 10,
              border: `1.5px solid ${form.satisfaction===v ? C.primary : C.border}`,
              background: form.satisfaction===v ? '#eef2ff' : 'white',
              color: form.satisfaction===v ? C.primary : C.muted,
              fontSize: 14, fontWeight: 600, cursor: 'pointer'
            }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn" onClick={submitSession} disabled={loading} style={{ flex: 2 }}>
          {loading ? '저장 중...' : editSession ? '수정하기' : '기록 추가'}
        </button>
        <button className="btn-ghost" onClick={() => { setShowForm(false); setEditSession(null); setForm(emptyForm); }} style={{ flex: 1 }}>취소</button>
      </div>
    </div>
  );

  return (
    <div className="app">
      <style>{css}</style>

      {/* 헤더 */}
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19 }}>📚</div>
          {editName ? (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input style={{ width: 100, padding: '.4rem .6rem', border: `1.5px solid ${C.primary}`, borderRadius: 8, fontSize: 14 }}
                value={nameInput} onChange={e => setNameInput(e.target.value)}
                onKeyDown={async e => { if (e.key==='Enter') { await api.patch('/student/name', { name: nameInput }); setProfile({...profile, name: nameInput}); setEditName(false); toast('✅ 이름이 저장되었습니다'); }}} autoFocus />
              <button onClick={async () => { await api.patch('/student/name', { name: nameInput }); setProfile({...profile, name: nameInput}); setEditName(false); toast('✅ 이름 저장'); }}
                style={{ padding: '.4rem .75rem', background: C.primary, color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>저장</button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontWeight: 800, fontSize: 16 }}>{displayName}</span>
                <button onClick={() => { setNameInput(displayName); setEditName(true); }}
                  style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: 14, cursor: 'pointer' }}>✏️</button>
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>공부 기록</div>
            </div>
          )}
        </div>
        <button onClick={onLogout} style={{ background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '.4rem .875rem', color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>로그아웃</button>
      </div>

      {/* 탭 */}
      <div className="tabs">
        {([['today','🏠 오늘'],['record','📅 기록 조회'],['plan','🎯 공부 계획'],['weekly','📈 주간'],['monthly','📆 월간'],['subject','📊 과목별']] as const).map(([t,l]) => (
          <button key={t} className={`tab ${tab===t?'on':'off'}`} onClick={() => setTab(t as any)}>{l}</button>
        ))}
      </div>

      <div className="container">
        {msg && <div className="toast">{msg}</div>}

        {/* ══ 오늘 탭 ══════════════════════════════════ */}
        {tab === 'today' && (
          <>
            {/* 히어로 */}
            <div className="hero">
              <p style={{ opacity: .8, fontSize: 13, marginBottom: 4 }}>
                {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short', timeZone: 'Asia/Seoul' })} 순공부시간
              </p>
              <p style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.1 }}>{fmt(todayTotal)}</p>
              <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 13, opacity: .85, flexWrap: 'wrap' }}>
                <span>📝 {sessions.length}개 세션</span>
                <span>🎯 계획 {achievementRate}%</span>
                {sleep?.wake_time && <span>☀️ 기상 {sleep.wake_time}</span>}
              </div>
              <div style={{ marginTop: 12, height: 6, background: 'rgba(255,255,255,.2)', borderRadius: 3 }}>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,.85)', width: `${Math.min(todayTotal/180*100,100)}%`, transition: 'width .5s' }} />
              </div>
              <p style={{ fontSize: 11, opacity: .65, marginTop: 4 }}>목표 3시간 기준</p>
            </div>

            {/* 공부 기록 */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 800, fontSize: 16 }}>오늘의 공부 기록</span>
                <button className="btn-sm" onClick={() => { setShowForm(!showForm); setEditSession(null); setForm(emptyForm); }}>
                  {showForm ? '닫기' : '+ 추가'}
                </button>
              </div>
              {showForm && <SessionForm />}
              {sessions.length > 0 ? sessions.map(s => (
                <div key={s.id} className="session-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontWeight: 800, fontSize: 15 }}>{s.subject}</span>
                        <span className="badge badge-purple">{getStudyType(s.study_type).icon} {getStudyType(s.study_type).label}</span>
                        {s.satisfaction && <span className="badge" style={{ background: s.satisfaction==='high'?'#d1fae5':s.satisfaction==='mid'?'#fef3c7':'#fee2e2', color: s.satisfaction==='high'?'#065f46':s.satisfaction==='mid'?'#92400e':'#991b1b' }}>{s.satisfaction==='high'?'😊 상':s.satisfaction==='mid'?'😐 중':'😔 하'}</span>}
                      </div>
                      {s.content && <p style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>{s.content}</p>}
                      {s.workbook_name && <p style={{ fontSize: 12, color: C.muted }}>📖 {s.workbook_name}</p>}
                      {(s.problem_count||0) > 0 && (
                        <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                          <span className="badge badge-green">✅ {s.correct_count}/{s.problem_count}문제</span>
                          <span className="badge badge-purple">{Math.round((s.correct_count||0)/(s.problem_count||1)*100)}% 정답</span>
                        </div>
                      )}
                      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>
                        {fmtTime(s.start_time)} ~ {fmtTime(s.end_time)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, marginLeft: 10 }}>
                      <span style={{ fontWeight: 800, color: C.primary, fontSize: 16 }}>{s.duration_minutes}분</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => startEdit(s)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 16, cursor: 'pointer' }}>✏️</button>
                        <button onClick={() => deleteSession(s.id)} style={{ background: 'none', border: 'none', color: '#fca5a5', fontSize: 16, cursor: 'pointer' }}>🗑</button>
                      </div>
                    </div>
                  </div>
                </div>
              )) : !showForm && (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: C.muted }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>📝</div>
                  <p style={{ fontWeight: 600 }}>아직 기록이 없어요</p>
                  <p style={{ fontSize: 13, marginTop: 4 }}>+ 추가 버튼을 눌러 공부를 기록해보세요!</p>
                </div>
              )}
            </div>

            {/* 오늘 과목 비중 */}
            {Object.keys(todaySubjects).length > 0 && (
              <div className="card">
                <p style={{ fontWeight: 800, fontSize: 15, marginBottom: '1rem' }}>오늘 과목 비중</p>
                {Object.entries(todaySubjects).map(([subj, min], i) => {
                  const total = Object.values(todaySubjects).reduce((a,b)=>a+b,0);
                  const pct = Math.round(min/total*100);
                  return (
                    <div key={subj} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i%COLORS.length], flexShrink: 0 }} />
                          <span style={{ fontWeight: 600 }}>{subj}</span>
                        </div>
                        <span style={{ fontWeight: 700, color: COLORS[i%COLORS.length] }}>{fmt(min)} ({pct}%)</span>
                      </div>
                      <div className="bar-bg"><div className="bar" style={{ width: `${pct}%`, background: COLORS[i%COLORS.length] }} /></div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 취침/기상 */}
            <div className="card">
              <p style={{ fontWeight: 800, fontSize: 15, marginBottom: '1rem' }}>🌙 취침 / 기상 시간</p>
              <div className="grid2">
                <div>
                  <label className="label">기상 시간</label>
                  <input type="time" className="inp" value={wakeTime} onChange={e => setWakeTime(e.target.value)} />
                </div>
                <div>
                  <label className="label">취침 시간</label>
                  <input type="time" className="inp" value={bedTime} onChange={e => setBedTime(e.target.value)} />
                </div>
              </div>
              <button className="btn" style={{ marginTop: 10 }} onClick={saveSleep}>저장하기</button>
            </div>
          </>
        )}

        {/* ══ 기록 조회 탭 ══════════════════════════════ */}
        {tab === 'record' && (
          <>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: '1rem' }}>
              <button className="btn-ghost" onClick={() => { const d=new Date(selDate); d.setDate(d.getDate()-1); setSelDate(d.toISOString().split('T')[0]); }}>← 전날</button>
              <input type="date" value={selDate} onChange={e => setSelDate(e.target.value)}
                style={{ flex: 1, padding: '.625rem', border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 14, background: 'white', outline: 'none' }} />
              <button className="btn-ghost" onClick={() => { const d=new Date(selDate); d.setDate(d.getDate()+1); setSelDate(d.toISOString().split('T')[0]); }}>다음 →</button>
            </div>
            {selDate !== todayStr() && (
              <button className="btn-sm" onClick={() => setSelDate(todayStr())} style={{ marginBottom: '1rem', display: 'block' }}>오늘로</button>
            )}
            <div className="card">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: '1rem' }}>
                {[
                  { label: '순공부시간', value: fmt(todayTotal), color: C.primary },
                  { label: '세션 수', value: `${sessions.length}개`, color: C.success },
                  { label: '과목 수', value: `${Object.keys(todaySubjects).length}개`, color: C.warning },
                ].map(c => (
                  <div key={c.label} className="stat-mini">
                    <div style={{ fontSize: 17, fontWeight: 800, color: c.color }}>{c.value}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{c.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 700 }}>공부 기록</span>
                <button className="btn-sm" onClick={() => { setShowForm(!showForm); setEditSession(null); setForm(emptyForm); }}>+ 추가</button>
              </div>
              {showForm && <SessionForm />}
              {sessions.map(s => (
                <div key={s.id} className="session-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontWeight: 700 }}>{s.subject}</span>
                        <span className="badge badge-purple">{getStudyType(s.study_type).icon} {getStudyType(s.study_type).label}</span>
                      </div>
                      {s.content && <p style={{ fontSize: 13, color: C.muted }}>{s.content}</p>}
                      {s.workbook_name && <p style={{ fontSize: 12, color: C.muted }}>📖 {s.workbook_name}</p>}
                      {(s.problem_count||0) > 0 && (
                        <span className="badge badge-green" style={{ marginTop: 4, display: 'inline-flex' }}>✅ {s.correct_count}/{s.problem_count} ({Math.round((s.correct_count||0)/(s.problem_count||1)*100)}%)</span>
                      )}
                      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{fmtTime(s.start_time)} ~ {fmtTime(s.end_time)}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, marginLeft: 10 }}>
                      <span style={{ fontWeight: 800, color: C.primary }}>{s.duration_minutes}분</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => startEdit(s)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 15, cursor: 'pointer' }}>✏️</button>
                        <button onClick={() => deleteSession(s.id)} style={{ background: 'none', border: 'none', color: '#fca5a5', fontSize: 15, cursor: 'pointer' }}>🗑</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {sessions.length === 0 && !showForm && <p style={{ textAlign: 'center', color: C.muted, padding: '2rem' }}>이 날은 기록이 없어요</p>}
            </div>
          </>
        )}

        {/* ══ 공부 계획 탭 ══════════════════════════════ */}
        {tab === 'plan' && (
          <>
            <div className="hero" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 8px 24px rgba(16,185,129,.3)' }}>
              <p style={{ opacity: .85, fontSize: 13, marginBottom: 4 }}>오늘 계획 달성률</p>
              <p style={{ fontSize: 52, fontWeight: 800 }}>{achievementRate}%</p>
              <div style={{ height: 8, background: 'rgba(255,255,255,.2)', borderRadius: 4, marginTop: 12 }}>
                <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,.85)', width: `${achievementRate}%`, transition: 'width .5s' }} />
              </div>
              <p style={{ fontSize: 13, opacity: .75, marginTop: 6 }}>{plans.filter(p=>p.is_completed).length} / {plans.length} 완료</p>
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 800, fontSize: 16 }}>오늘의 To Do</span>
                <button className="btn-sm" onClick={() => setShowPlanForm(!showPlanForm)}>{showPlanForm ? '닫기' : '+ 추가'}</button>
              </div>

              {showPlanForm && (
                <div style={{ background: C.bg, borderRadius: 12, padding: '1rem', border: `1.5px solid ${C.border}`, marginBottom: '1rem' }}>
                  <div className="grid2">
                    <div>
                      <label className="label">과목 *</label>
                      <select className="sel" value={planForm.subject} onChange={e => setPlanForm({...planForm, subject: e.target.value})}>
                        <option value="">선택</option>
                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">목표 시간(분)</label>
                      <input className="inp" type="number" placeholder="60" value={planForm.targetDuration}
                        onChange={e => setPlanForm({...planForm, targetDuration: e.target.value})} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label className="label">유형</label>
                    <select className="sel" value={planForm.studyType} onChange={e => setPlanForm({...planForm, studyType: e.target.value})}>
                      {STUDY_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label className="label">메모</label>
                    <input className="inp" placeholder="예: 수능완성 15~20번" value={planForm.description}
                      onChange={e => setPlanForm({...planForm, description: e.target.value})} />
                  </div>
                  <button className="btn-green" onClick={addPlan}>계획 추가</button>
                </div>
              )}

              {plans.filter(p=>!p.is_completed).length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 8 }}>📋 할 일 ({plans.filter(p=>!p.is_completed).length})</p>
                  {plans.filter(p=>!p.is_completed).map(p => (
                    <div key={p.id} className="plan-item">
                      <button onClick={() => completePlan(p.id)} style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${C.border}`, background: 'white', flexShrink: 0, cursor: 'pointer' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700 }}>{p.subject}</span>
                          <span className="badge badge-purple">{getStudyType(p.study_type).icon} {getStudyType(p.study_type).label}</span>
                          {p.target_duration && <span style={{ fontSize: 12, color: C.muted }}>{p.target_duration}분 목표</span>}
                        </div>
                        {p.description && <p style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{p.description}</p>}
                      </div>
                      <button onClick={async () => { await api.delete(`/student/plans/${p.id}`); const d=await api.get(`/student/plans?date=${selDate}`); setPlans(d); }} style={{ background: 'none', border: 'none', color: '#fca5a5', fontSize: 18, cursor: 'pointer' }}>🗑</button>
                    </div>
                  ))}
                </div>
              )}

              {plans.filter(p=>p.is_completed).length > 0 && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: C.success, marginBottom: 8 }}>✅ 완료 ({plans.filter(p=>p.is_completed).length})</p>
                  {plans.filter(p=>p.is_completed).map(p => (
                    <div key={p.id} className="plan-done">
                      <span style={{ fontSize: 18 }}>✅</span>
                      <span style={{ flex: 1, fontWeight: 600, textDecoration: 'line-through', color: '#94a3b8' }}>{p.subject} - {getStudyType(p.study_type).label}</span>
                      <button onClick={async () => { await api.delete(`/student/plans/${p.id}`); const d=await api.get(`/student/plans?date=${selDate}`); setPlans(d); }} style={{ background: 'none', border: 'none', color: '#d1fae5', fontSize: 16, cursor: 'pointer' }}>🗑</button>
                    </div>
                  ))}
                </div>
              )}

              {plans.length === 0 && !showPlanForm && (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: C.muted }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>🎯</div>
                  <p style={{ fontWeight: 600 }}>오늘의 계획을 세워보세요!</p>
                </div>
              )}

              {plans.length > 0 && plans.every(p=>p.is_completed) && (
                <div style={{ textAlign: 'center', padding: '1rem', background: '#f0fdf4', borderRadius: 12, marginTop: 12, border: '1.5px solid #bbf7d0' }}>
                  <div style={{ fontSize: 32 }}>🎉</div>
                  <p style={{ fontWeight: 800, color: '#065f46', marginTop: 4 }}>오늘 계획을 모두 완료했어요!</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ══ 주간 탭 ══════════════════════════════════ */}
        {tab === 'weekly' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 800, fontSize: 16 }}>이번 주 공부 현황</span>
              <span style={{ fontWeight: 800, color: C.primary }}>{fmt(weeklyTotal)}</span>
            </div>
            {weekly.length > 0 ? weekly.map((d,i) => {
              const max = Math.max(...weekly.map(x=>parseInt(x.minutes||0)));
              const pct = max>0 ? Math.round(parseInt(d.minutes||0)/max*100) : 0;
              const date = new Date(d.date+'T12:00:00');
              const dayName = date.toLocaleDateString('ko-KR', { weekday: 'short' });
              return (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 5 }}>
                    <span style={{ fontWeight: 600 }}>{d.date.slice(5)} ({dayName})</span>
                    <span style={{ fontWeight: 700, color: C.primary }}>{fmt(parseInt(d.minutes||0))}</span>
                  </div>
                  <div className="bar-bg"><div className="bar" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)' }} /></div>
                </div>
              );
            }) : <p style={{ textAlign: 'center', color: C.muted, padding: '2rem' }}>데이터가 없습니다</p>}
          </div>
        )}

        {/* ══ 월간 탭 ══════════════════════════════════ */}
        {tab === 'monthly' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 800, fontSize: 16 }}>이번 달 공부 현황</span>
              <span style={{ fontWeight: 800, color: C.success }}>{fmt(monthlyTotal)}</span>
            </div>
            {monthly.length > 0 ? monthly.map((d,i) => {
              const max = Math.max(...monthly.map(x=>parseInt(x.minutes||0)));
              const pct = max>0 ? Math.round(parseInt(d.minutes||0)/max*100) : 0;
              return (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{String(d.date).slice(5)}</span>
                    <span style={{ fontWeight: 700, color: C.success }}>{fmt(parseInt(d.minutes||0))}</span>
                  </div>
                  <div className="bar-bg"><div className="bar" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#10b981,#34d399)' }} /></div>
                </div>
              );
            }) : <p style={{ textAlign: 'center', color: C.muted, padding: '2rem' }}>데이터가 없습니다</p>}
          </div>
        )}

        {/* ══ 과목별 탭 ══════════════════════════════════ */}
        {tab === 'subject' && (
          <div className="card">
            <p style={{ fontWeight: 800, fontSize: 16, marginBottom: '1rem' }}>이달 과목별 통계</p>
            {subjectStats.length > 0 ? subjectStats.map((s,i) => {
              const total = subjectStats.reduce((sum,x)=>sum+parseInt(x.total_minutes||0),0);
              const pct = Math.round(parseInt(s.total_minutes||0)/total*100);
              const correctRate = s.total_problems > 0 ? Math.round(s.total_correct/s.total_problems*100) : null;
              return (
                <div key={s.subject} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: COLORS[i%COLORS.length], flexShrink: 0 }} />
                      <span style={{ fontWeight: 800, fontSize: 15 }}>{s.subject}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 800, color: COLORS[i%COLORS.length], fontSize: 15 }}>{fmt(parseInt(s.total_minutes||0))}</span>
                      <span style={{ fontSize: 12, color: C.muted, marginLeft: 6 }}>({pct}%)</span>
                    </div>
                  </div>
                  <div className="bar-bg" style={{ marginBottom: 6 }}><div className="bar" style={{ width: `${pct}%`, background: COLORS[i%COLORS.length] }} /></div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span className="badge badge-purple">📅 {s.session_count}회</span>
                    {correctRate !== null && (
                      <>
                        <span className="badge badge-green">✅ {s.total_correct}/{s.total_problems}문제</span>
                        <span className="badge" style={{ background: correctRate>=80?'#d1fae5':correctRate>=60?'#fef3c7':'#fee2e2', color: correctRate>=80?'#065f46':correctRate>=60?'#92400e':'#991b1b' }}>{correctRate}% 정답</span>
                      </>
                    )}
                  </div>
                </div>
              );
            }) : <p style={{ textAlign: 'center', color: C.muted, padding: '2rem' }}>데이터가 없습니다</p>}
          </div>
        )}
      </div>
    </div>
  );
}
