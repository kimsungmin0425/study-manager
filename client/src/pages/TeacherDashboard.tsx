import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { api } from '../api';

type Group = { id: number; name: string; student_count: number };
type Student = { id: number; name: string; phone: string; group_id: number };

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#84cc16'];
const fmt = (m: number) => { if(!m) return '0분'; const h=Math.floor(m/60),min=m%60; return h>0?`${h}시간 ${min}분`:`${min}분`; };
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',hour12:true,timeZone:'Asia/Seoul'});

const STUDY_TYPE_LABELS: Record<string,string> = {
  new_problems:'신규 문제풀이', review_problems:'복습 문제풀이', concept:'개념 학습',
  concept_review:'개념 복습', wrong_note:'오답노트', memorize:'암기',
  lecture:'강의 수강', mock_exam:'모의고사', reading:'독서', other:'기타'
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Noto Sans KR',sans-serif;background:#f8faff;color:#0f172a;}
button,input,select{font-family:inherit;}
.app{min-height:100vh;background:#f8faff;}
.header{background:white;padding:.875rem 1.25rem;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;border-bottom:1px solid #e2e8f0;box-shadow:0 2px 8px rgba(0,0,0,.04);}
.tabs{display:flex;gap:6px;padding:.75rem 1.25rem;background:white;border-bottom:1px solid #e2e8f0;}
.tab{padding:.5rem 1.25rem;border-radius:10px;border:none;font-size:13px;font-weight:700;cursor:pointer;transition:all .2s;white-space:nowrap;}
.tab.on{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;box-shadow:0 3px 8px rgba(99,102,241,.3);}
.tab.off{background:#f8faff;color:#64748b;border:1.5px solid #e2e8f0;}
.con{padding:1rem 1.25rem;max-width:640px;margin:0 auto;}
.card{background:white;border-radius:16px;padding:1.25rem;margin-bottom:1rem;border:1px solid #e2e8f0;box-shadow:0 2px 8px rgba(0,0,0,.04);}
.inp{width:100%;padding:.75rem 1rem;border:1.5px solid #e2e8f0;border-radius:12px;font-size:15px;outline:none;background:#f8faff;transition:all .2s;}
.inp:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.1);background:white;}
.btn{width:100%;padding:.875rem;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(99,102,241,.3);margin-top:10px;}
.btn-green{width:100%;padding:.875rem;background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(16,185,129,.3);margin-top:8px;}
.btn-sm{padding:.4rem .875rem;background:#eef2ff;color:#6366f1;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;}
.btn-back{background:none;border:none;color:#64748b;font-size:14px;font-weight:600;padding:.5rem 0;cursor:pointer;display:flex;align-items:center;gap:6px;margin-bottom:.75rem;}
.btn-ghost{background:none;border:1.5px solid #e2e8f0;border-radius:10px;padding:.5rem 1rem;color:#64748b;font-size:14px;font-weight:600;cursor:pointer;}
.group-item{display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;background:white;border-radius:14px;margin-bottom:10px;cursor:pointer;border:1.5px solid #e2e8f0;box-shadow:0 2px 8px rgba(0,0,0,.04);transition:all .2s;}
.group-item:active{border-color:#6366f1;background:#eef2ff;}
.student-row{display:flex;align-items:center;justify-content:space-between;padding:.875rem 1rem;background:#f8faff;border-radius:12px;margin-bottom:8px;border:1.5px solid #e2e8f0;cursor:pointer;transition:all .2s;}
.student-row:active{border-color:#6366f1;}
.badge{display:inline-flex;align-items:center;gap:3px;padding:3px 8px;border-radius:999px;font-size:12px;font-weight:700;}
.badge-blue{background:#eef2ff;color:#6366f1;}
.badge-green{background:#d1fae5;color:#065f46;}
.badge-orange{background:#fef3c7;color:#92400e;}
.session-card{padding:1rem;background:#f8faff;border-radius:12px;margin-bottom:8px;border-left:3px solid #6366f1;}
.label{font-size:13px;font-weight:600;color:#64748b;margin-bottom:5px;display:block;}
.toast{background:#0f172a;color:white;border-radius:12px;padding:.75rem 1rem;font-size:14px;margin-bottom:1rem;}
.stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:1rem;}
.stat-box{text-align:center;padding:.875rem .5rem;background:#f8faff;border-radius:12px;border:1px solid #e2e8f0;}
.hero-card{border-radius:20px;padding:1.5rem;margin-bottom:1rem;color:white;}
.section-title{font-size:17px;font-weight:800;color:#0f172a;margin-bottom:1rem;}
.link-box{background:#f0fdf4;border:1.5px solid #86efac;border-radius:12px;padding:1rem;margin-top:12px;}
.today-student{background:white;border-radius:14px;padding:1rem 1.25rem;margin-bottom:10px;border:1.5px solid #e2e8f0;box-shadow:0 2px 8px rgba(0,0,0,.04);}
.progress-bar{height:6px;background:#e2e8f0;border-radius:3px;margin-top:8px;}
.progress-fill{height:6px;border-radius:3px;transition:width .5s;}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;}
.view-more{display:flex;align-items:center;justify-content:center;gap:6px;padding:.75rem;background:#f8faff;border-radius:10px;border:1.5px dashed #e2e8f0;cursor:pointer;color:#6366f1;font-size:14px;font-weight:700;margin-top:8px;}
`;

export default function TeacherDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<'groups'|'today'>('groups');
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group|null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [view, setView] = useState<'groupList'|'studentList'|'studentDetail'>('groupList');
  const [selectedStudent, setSelectedStudent] = useState<Student|null>(null);
  const [studentDetail, setStudentDetail] = useState<any>(null);
  const [studentWeekly, setStudentWeekly] = useState<any[]>([]);
  const [studentMonthly, setStudentMonthly] = useState<any[]>([]);
  const [studentSubjects, setStudentSubjects] = useState<any[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [detailTab, setDetailTab] = useState<'today'|'weekly'|'monthly'|'subject'>('today');

  const toast = (m: string) => { setMsg(m); setTimeout(()=>setMsg(''), 3000); };

  const loadGroups = useCallback(async () => {
    const data = await api.get('/teacher/groups');
    setGroups(data);
  }, []);

  useEffect(() => { loadGroups(); }, []);

  useEffect(() => {
    if (!selectedGroup) return;
    api.get(`/teacher/groups/${selectedGroup.id}/students`).then(setStudents);
  }, [selectedGroup]);

  useEffect(() => {
    if (!selectedStudent) return;
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth()+1;
    Promise.all([
      api.get(`/teacher/students/${selectedStudent.id}/today`),
      api.get(`/teacher/students/${selectedStudent.id}/monthly?year=${y}&month=${m}`),
      api.get(`/teacher/students/${selectedStudent.id}/subject-stats?year=${y}&month=${m}`),
    ]).then(([today, monthly, subjects]) => {
      setStudentDetail(today);
      setStudentMonthly(monthly);
      setStudentSubjects(subjects);
    });
    // 주간 (monthly에서 최근 7일)
    api.get(`/teacher/students/${selectedStudent.id}/monthly?year=${now.getFullYear()}&month=${now.getMonth()+1}`)
      .then(data => setStudentWeekly(data.slice(-7)));
  }, [selectedStudent]);

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    await api.post('/teacher/groups', { name: newGroupName });
    setNewGroupName(''); loadGroups(); toast('✅ 그룹이 생성되었습니다');
  };

  const inviteStudent = async () => {
    if (!inviteName.trim() || !invitePhone.trim() || !selectedGroup) return;
    setLoading(true);
    try {
      const res = await api.post(`/teacher/groups/${selectedGroup.id}/invite`, { name: inviteName, phone: invitePhone });
      setInviteLink(res.inviteLink);
      setInviteName(''); setInvitePhone('');
      api.get(`/teacher/groups/${selectedGroup.id}/students`).then(setStudents);
      loadGroups(); toast('🔗 초대 링크 생성됨');
    } catch (e: any) { toast('❌ ' + e.message); }
    setLoading(false);
  };

  const copyLink = (link: string) => { navigator.clipboard.writeText(link); toast('📋 링크가 복사되었습니다!'); };

  // 학생 상세 클릭
  const openStudent = (s: Student) => {
    setSelectedStudent(s);
    setView('studentDetail');
    setDetailTab('today');
    setStudentDetail(null);
    setStudentWeekly([]);
    setStudentMonthly([]);
    setStudentSubjects([]);
  };

  const weeklyTotal = studentWeekly.reduce((s,x)=>s+parseInt(x.minutes||0),0);
  const monthlyTotal = studentMonthly.reduce((s,x)=>s+parseInt(x.minutes||0),0);

  return (
    <div className="app">
      <style>{css}</style>
      {/* 헤더 */}
      <div className="header">
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:38,height:38,background:'linear-gradient(135deg,#6366f1,#8b5cf6)',borderRadius:11,display:'flex',alignItems:'center',justifyContent:'center',fontSize:19}}>📚</div>
          <div>
            <div style={{fontWeight:800,fontSize:15}}>학습 관리</div>
            <div style={{fontSize:11,color:'#64748b'}}>선생님 대시보드</div>
          </div>
        </div>
        <button onClick={onLogout} style={{background:'#f8faff',border:'1.5px solid #e2e8f0',borderRadius:10,padding:'.4rem .875rem',color:'#64748b',fontSize:13,fontWeight:600,cursor:'pointer'}}>로그아웃</button>
      </div>

      {/* 탭 */}
      <div className="tabs">
        <button className={`tab ${tab==='groups'?'on':'off'}`} onClick={()=>setTab('groups')}>👥 그룹 관리</button>
        <button className={`tab ${tab==='today'?'on':'off'}`} onClick={()=>setTab('today')}>📊 오늘 현황</button>
      </div>

      <div className="con">
        {msg && <div className="toast">{msg}</div>}

        {/* ── 그룹 관리 탭 ── */}
        {tab === 'groups' && (
          <>
            {/* 그룹 목록 */}
            {view === 'groupList' && (
              <>
                <div className="card">
                  <p className="label">새 그룹 만들기</p>
                  <input className="inp" placeholder="예: 중3 수학, 고1 영어" value={newGroupName}
                    onChange={e=>setNewGroupName(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&createGroup()} />
                  <button className="btn" onClick={createGroup}>+ 그룹 추가</button>
                </div>
                {groups.map(g => (
                  <div key={g.id} className="group-item" onClick={()=>{ setSelectedGroup(g); setView('studentList'); setInviteLink(''); }}>
                    <div>
                      <div style={{fontWeight:700,fontSize:16}}>{g.name}</div>
                      <div style={{fontSize:13,color:'#64748b',marginTop:3}}>👤 {g.student_count||0}명</div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <span style={{color:'#6366f1',fontSize:20}}>›</span>
                      <button onClick={e=>{e.stopPropagation();if(confirm('삭제할까요?'))api.delete(`/teacher/groups/${g.id}`).then(()=>{ if(selectedGroup?.id===g.id)setSelectedGroup(null); loadGroups(); });}} style={{background:'none',border:'none',color:'#fca5a5',fontSize:18,cursor:'pointer'}}>🗑</button>
                    </div>
                  </div>
                ))}
                {groups.length===0 && <div style={{textAlign:'center',padding:'3rem',color:'#94a3b8'}}><div style={{fontSize:48,marginBottom:12}}>📂</div><p style={{fontWeight:600}}>그룹이 없습니다</p></div>}
              </>
            )}

            {/* 학생 목록 */}
            {view === 'studentList' && selectedGroup && (
              <>
                <button className="btn-back" onClick={()=>setView('groupList')}>← 그룹 목록</button>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:'1.25rem'}}>
                  <div style={{width:44,height:44,background:'linear-gradient(135deg,#6366f1,#8b5cf6)',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>👥</div>
                  <div>
                    <div style={{fontWeight:800,fontSize:20}}>{selectedGroup.name}</div>
                    <div style={{fontSize:13,color:'#64748b'}}>학생 {selectedGroup.student_count||0}명</div>
                  </div>
                </div>

                {/* 초대 */}
                <div className="card">
                  <p style={{fontWeight:700,fontSize:15,marginBottom:'1rem'}}>📨 학생 초대</p>
                  <div className="grid2">
                    <div><label className="label">학생 이름</label><input className="inp" placeholder="홍길동" value={inviteName} onChange={e=>setInviteName(e.target.value)}/></div>
                    <div><label className="label">핸드폰 번호</label><input className="inp" placeholder="01012345678" value={invitePhone} onChange={e=>setInvitePhone(e.target.value)}/></div>
                  </div>
                  <button className="btn" onClick={inviteStudent} disabled={loading}>{loading?'생성 중...':'🔗 초대 링크 생성'}</button>
                  {inviteLink && (
                    <div className="link-box">
                      <p style={{fontSize:13,color:'#065f46',fontWeight:700,marginBottom:8}}>✅ 초대 링크 생성 완료!</p>
                      <div style={{background:'white',borderRadius:8,padding:'.625rem',marginBottom:10,fontSize:12,color:'#64748b',wordBreak:'break-all',border:'1px solid #e2e8f0'}}>{inviteLink}</div>
                      <button className="btn-green" onClick={()=>copyLink(inviteLink)} style={{marginTop:0}}>📋 링크 복사 (카톡 전송)</button>
                    </div>
                  )}
                </div>

                {/* 학생 목록 */}
                <div className="card">
                  <p className="section-title">학생 목록 ({students.length}명)</p>
                  {students.map(s => (
                    <div key={s.id} className="student-row" onClick={()=>openStudent(s)}>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:15}}>{s.name||'이름 미설정'}</div>
                        <div style={{fontSize:13,color:'#94a3b8',marginTop:2}}>{s.phone}</div>
                      </div>
                      <div style={{display:'flex',gap:8,alignItems:'center'}}>
                        <button className="btn-sm" onClick={async e=>{e.stopPropagation();const r=await api.post(`/teacher/groups/${selectedGroup.id}/invite`,{name:s.name,phone:s.phone});copyLink(r.inviteLink);}}>링크</button>
                        <span style={{color:'#6366f1',fontSize:18}}>›</span>
                        <button onClick={e=>{e.stopPropagation();if(confirm('삭제?'))api.delete(`/teacher/students/${s.id}`).then(()=>api.get(`/teacher/groups/${selectedGroup.id}/students`).then(setStudents));}} style={{background:'none',border:'none',color:'#fca5a5',fontSize:18,cursor:'pointer'}}>🗑</button>
                      </div>
                    </div>
                  ))}
                  {students.length===0 && <p style={{textAlign:'center',color:'#94a3b8',padding:'1.5rem'}}>학생이 없습니다. 위에서 초대해보세요!</p>}
                </div>
              </>
            )}

            {/* 학생 상세 대시보드 */}
            {view === 'studentDetail' && selectedStudent && (
              <>
                <button className="btn-back" onClick={()=>{setView('studentList');setStudentDetail(null);}}>← {selectedGroup?.name}</button>

                {/* 학생 헤더 */}
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:'1.25rem'}}>
                  <div style={{width:52,height:52,background:'linear-gradient(135deg,#6366f1,#8b5cf6)',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>🧑‍🎓</div>
                  <div>
                    <div style={{fontWeight:800,fontSize:22}}>{selectedStudent.name}</div>
                    <div style={{fontSize:13,color:'#64748b'}}>{selectedStudent.phone}</div>
                  </div>
                </div>

                {/* 상세 탭 */}
                <div style={{display:'flex',gap:6,marginBottom:'1rem',overflowX:'auto'}}>
                  {([['today','오늘'],['weekly','주간'],['monthly','월간'],['subject','과목별']] as const).map(([t,l]) => (
                    <button key={t} className={`tab ${detailTab===t?'on':'off'}`} onClick={()=>setDetailTab(t)}>{l}</button>
                  ))}
                </div>

                {/* 오늘 탭 */}
                {detailTab === 'today' && studentDetail && (
                  <>
                    {/* 히어로 */}
                    <div className="hero-card" style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)'}}>
                      <p style={{opacity:.8,fontSize:13,marginBottom:4}}>오늘 순공부시간</p>
                      <p style={{fontSize:44,fontWeight:800}}>{fmt(studentDetail.totalMinutes||0)}</p>
                      <p style={{opacity:.7,fontSize:13,marginTop:4}}>{studentDetail.sessions.length}개 세션</p>
                    </div>

                    {/* 취침/기상 */}
                    {studentDetail.sleepRecord && (
                      <div className="card">
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                          <div style={{textAlign:'center',padding:'.75rem',background:'#f0f9ff',borderRadius:12}}>
                            <div style={{fontSize:24}}>☀️</div>
                            <div style={{fontSize:12,color:'#64748b',marginTop:4}}>기상</div>
                            <div style={{fontWeight:700,fontSize:18,marginTop:2}}>{studentDetail.sleepRecord.wake_time||'-'}</div>
                          </div>
                          <div style={{textAlign:'center',padding:'.75rem',background:'#f5f3ff',borderRadius:12}}>
                            <div style={{fontSize:24}}>🌙</div>
                            <div style={{fontSize:12,color:'#64748b',marginTop:4}}>취침</div>
                            <div style={{fontWeight:700,fontSize:18,marginTop:2}}>{studentDetail.sleepRecord.bed_time||'-'}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 오늘 과목 비중 */}
                    {studentDetail.sessions.length > 0 && (
                      <div className="card">
                        <p className="section-title">오늘 과목 비중</p>
                        {(() => {
                          const map: Record<string,number> = {};
                          studentDetail.sessions.forEach((s:any) => { map[s.subject]=(map[s.subject]||0)+s.duration_minutes; });
                          const total = Object.values(map).reduce((a,b)=>a+b,0);
                          return Object.entries(map).map(([subj,min],i) => {
                            const pct = Math.round((min as number)/total*100);
                            return (
                              <div key={subj} style={{marginBottom:12}}>
                                <div style={{display:'flex',justifyContent:'space-between',fontSize:14,marginBottom:5}}>
                                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                                    <div style={{width:10,height:10,borderRadius:'50%',background:COLORS[i%COLORS.length]}}/>
                                    <span style={{fontWeight:600}}>{subj}</span>
                                  </div>
                                  <span style={{fontWeight:700,color:COLORS[i%COLORS.length]}}>{fmt(min as number)} ({pct}%)</span>
                                </div>
                                <div style={{height:8,background:'#e2e8f0',borderRadius:4}}>
                                  <div style={{height:8,borderRadius:4,width:`${pct}%`,background:COLORS[i%COLORS.length],transition:'width .5s'}}/>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}

                    {/* 공부 기록 */}
                    <div className="card">
                      <p className="section-title">오늘 공부 기록</p>
                      {studentDetail.sessions.length > 0 ? studentDetail.sessions.map((s:any) => (
                        <div key={s.id} className="session-card">
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                            <div style={{flex:1}}>
                              <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',marginBottom:4}}>
                                <span style={{fontWeight:700,fontSize:15}}>{s.subject}</span>
                                <span className="badge badge-blue">{STUDY_TYPE_LABELS[s.study_type]||s.study_type}</span>
                                {s.satisfaction && <span className="badge" style={{background:s.satisfaction==='high'?'#d1fae5':s.satisfaction==='mid'?'#fef3c7':'#fee2e2',color:s.satisfaction==='high'?'#065f46':s.satisfaction==='mid'?'#92400e':'#991b1b'}}>{s.satisfaction==='high'?'😊 상':s.satisfaction==='mid'?'😐 중':'😔 하'}</span>}
                              </div>
                              {s.content && <p style={{fontSize:13,color:'#64748b',marginBottom:4}}>{s.content}</p>}
                              {s.workbook_name && <p style={{fontSize:12,color:'#94a3b8'}}>📖 {s.workbook_name}</p>}
                              {(s.problem_count||0)>0 && (
                                <div style={{display:'flex',gap:6,marginTop:4,flexWrap:'wrap'}}>
                                  <span className="badge badge-green">✅ {s.correct_count}/{s.problem_count}문제</span>
                                  <span className="badge badge-blue">{Math.round((s.correct_count||0)/(s.problem_count||1)*100)}% 정답</span>
                                </div>
                              )}
                              <p style={{fontSize:11,color:'#94a3b8',marginTop:5}}>{fmtTime(s.start_time)} ~ {fmtTime(s.end_time)}</p>
                            </div>
                            <span style={{fontWeight:800,color:'#6366f1',fontSize:16,marginLeft:10}}>{s.duration_minutes}분</span>
                          </div>
                        </div>
                      )) : (
                        <div style={{textAlign:'center',padding:'2rem',color:'#94a3b8'}}>
                          <div style={{fontSize:36,marginBottom:8}}>📝</div>
                          <p>오늘 공부 기록이 없습니다</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* 주간 탭 */}
                {detailTab === 'weekly' && (
                  <div className="card">
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
                      <p className="section-title" style={{marginBottom:0}}>이번 주 공부 현황</p>
                      <span style={{fontWeight:800,color:'#6366f1'}}>{fmt(weeklyTotal)}</span>
                    </div>
                    {studentWeekly.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={studentWeekly.map(d=>({...d,minutes:parseInt(d.minutes||0),label:String(d.date).slice(5)}))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                            <XAxis dataKey="label" tick={{fontSize:12}} />
                            <YAxis tick={{fontSize:12}} tickFormatter={v=>v+'분'}/>
                            <Tooltip formatter={(v:any)=>fmt(v)} labelFormatter={l=>`${l}`}/>
                            <Bar dataKey="minutes" fill="#6366f1" radius={[6,6,0,0]}/>
                          </BarChart>
                        </ResponsiveContainer>
                        <div style={{marginTop:'1rem'}}>
                          {studentWeekly.map((d,i)=>{
                            const max=Math.max(...studentWeekly.map(x=>parseInt(x.minutes||0)));
                            const pct=max>0?Math.round(parseInt(d.minutes||0)/max*100):0;
                            const date=new Date(d.date+'T12:00:00');
                            const day=date.toLocaleDateString('ko-KR',{weekday:'short'});
                            return (
                              <div key={i} style={{marginBottom:10}}>
                                <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:4}}>
                                  <span style={{fontWeight:600}}>{d.date.slice(5)} ({day})</span>
                                  <span style={{fontWeight:700,color:'#6366f1'}}>{fmt(parseInt(d.minutes||0))}</span>
                                </div>
                                <div style={{height:8,background:'#e2e8f0',borderRadius:4}}>
                                  <div style={{height:8,borderRadius:4,width:`${pct}%`,background:'linear-gradient(90deg,#6366f1,#8b5cf6)',transition:'width .5s'}}/>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : <p style={{textAlign:'center',color:'#94a3b8',padding:'2rem'}}>데이터가 없습니다</p>}
                  </div>
                )}

                {/* 월간 탭 */}
                {detailTab === 'monthly' && (
                  <div className="card">
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
                      <p className="section-title" style={{marginBottom:0}}>이번 달 공부 현황</p>
                      <span style={{fontWeight:800,color:'#10b981'}}>{fmt(monthlyTotal)}</span>
                    </div>
                    {studentMonthly.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={studentMonthly.map(d=>({...d,minutes:parseInt(d.minutes||0),label:String(d.date).slice(5)}))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                            <XAxis dataKey="label" tick={{fontSize:11}}/>
                            <YAxis tick={{fontSize:11}} tickFormatter={v=>v+'분'}/>
                            <Tooltip formatter={(v:any)=>fmt(v)}/>
                            <Line type="monotone" dataKey="minutes" stroke="#10b981" strokeWidth={3} dot={{fill:'#10b981',r:4}}/>
                          </LineChart>
                        </ResponsiveContainer>
                        <div style={{marginTop:'1rem'}}>
                          {studentMonthly.map((d,i)=>{
                            const max=Math.max(...studentMonthly.map(x=>parseInt(x.minutes||0)));
                            const pct=max>0?Math.round(parseInt(d.minutes||0)/max*100):0;
                            return (
                              <div key={i} style={{marginBottom:8}}>
                                <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:4}}>
                                  <span style={{fontWeight:600}}>{String(d.date).slice(5)}</span>
                                  <span style={{fontWeight:700,color:'#10b981'}}>{fmt(parseInt(d.minutes||0))}</span>
                                </div>
                                <div style={{height:6,background:'#e2e8f0',borderRadius:3}}>
                                  <div style={{height:6,borderRadius:3,width:`${pct}%`,background:'linear-gradient(90deg,#10b981,#34d399)',transition:'width .5s'}}/>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : <p style={{textAlign:'center',color:'#94a3b8',padding:'2rem'}}>데이터가 없습니다</p>}
                  </div>
                )}

                {/* 과목별 탭 */}
                {detailTab === 'subject' && (
                  <div className="card">
                    <p className="section-title">이달 과목별 통계</p>
                    {studentSubjects.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie data={studentSubjects.map(s=>({name:s.subject,value:parseInt(s.total_minutes||0)}))} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,percent})=>`${name} ${Math.round(percent*100)}%`}>
                              {studentSubjects.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                            </Pie>
                            <Tooltip formatter={(v:any)=>fmt(v)}/>
                          </PieChart>
                        </ResponsiveContainer>
                        <div style={{marginTop:'1rem'}}>
                          {studentSubjects.map((s,i)=>{
                            const total=studentSubjects.reduce((sum,x)=>sum+parseInt(x.total_minutes||0),0);
                            const pct=Math.round(parseInt(s.total_minutes||0)/total*100);
                            const correctRate=s.total_problems>0?Math.round(s.total_correct/s.total_problems*100):null;
                            return (
                              <div key={s.subject} style={{marginBottom:14}}>
                                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                                    <div style={{width:12,height:12,borderRadius:'50%',background:COLORS[i%COLORS.length]}}/>
                                    <span style={{fontWeight:800,fontSize:15}}>{s.subject}</span>
                                  </div>
                                  <div style={{textAlign:'right'}}>
                                    <span style={{fontWeight:800,color:COLORS[i%COLORS.length],fontSize:15}}>{fmt(parseInt(s.total_minutes||0))}</span>
                                    <span style={{fontSize:12,color:'#94a3b8',marginLeft:6}}>({pct}%)</span>
                                  </div>
                                </div>
                                <div style={{height:8,background:'#e2e8f0',borderRadius:4,marginBottom:6}}>
                                  <div style={{height:8,borderRadius:4,width:`${pct}%`,background:COLORS[i%COLORS.length],transition:'width .5s'}}/>
                                </div>
                                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                                  <span className="badge badge-blue">📅 {s.session_count}회</span>
                                  {correctRate!==null && (
                                    <>
                                      <span className="badge badge-green">✅ {s.total_correct}/{s.total_problems}문제</span>
                                      <span className="badge" style={{background:correctRate>=80?'#d1fae5':correctRate>=60?'#fef3c7':'#fee2e2',color:correctRate>=80?'#065f46':correctRate>=60?'#92400e':'#991b1b'}}>{correctRate}% 정답</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : <p style={{textAlign:'center',color:'#94a3b8',padding:'2rem'}}>데이터가 없습니다</p>}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── 오늘 현황 탭 ── */}
        {tab === 'today' && (
          <>
            <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:8,marginBottom:'1rem'}}>
              {groups.map(g=>(
                <button key={g.id} onClick={()=>setSelectedGroup(g)} style={{padding:'.5rem 1rem',borderRadius:10,border:'none',fontSize:13,fontWeight:700,whiteSpace:'nowrap',cursor:'pointer',background:selectedGroup?.id===g.id?'linear-gradient(135deg,#6366f1,#8b5cf6)':'white',color:selectedGroup?.id===g.id?'white':'#64748b',border:selectedGroup?.id===g.id?'none':'1.5px solid #e2e8f0',boxShadow:selectedGroup?.id===g.id?'0 4px 12px rgba(99,102,241,.3)':'0 2px 4px rgba(0,0,0,.04)'} as any}>
                  {g.name}
                </button>
              ))}
            </div>
            {selectedGroup ? <TodayOverview groupId={selectedGroup.id} onStudentClick={(s)=>{ setView('studentDetail'); setDetailTab('today'); setSelectedStudent(s); setTab('groups'); }} /> : (
              <div style={{textAlign:'center',padding:'3rem',color:'#94a3b8'}}>
                <div style={{fontSize:36,marginBottom:8}}>👆</div>
                <p>위에서 그룹을 선택해주세요</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TodayOverview({ groupId, onStudentClick }: { groupId: number; onStudentClick: (s: Student) => void }) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const load = () => api.get(`/teacher/groups/${groupId}/today`).then(setData);
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [groupId]);

  const fmt = (m: number) => { if(!m) return '0분'; const h=Math.floor(m/60),min=m%60; return h>0?`${h}시간 ${min}분`:`${min}분`; };
  const totalToday = data.reduce((s,x)=>s+(x.today_minutes||0),0);

  return (
    <div>
      <div style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)',borderRadius:20,padding:'1.5rem',marginBottom:'1rem',color:'white',boxShadow:'0 8px 24px rgba(99,102,241,.35)'}}>
        <p style={{opacity:.8,fontSize:13,marginBottom:4}}>그룹 전체 오늘 공부시간</p>
        <p style={{fontSize:40,fontWeight:800}}>{fmt(totalToday)}</p>
        <p style={{opacity:.7,fontSize:13,marginTop:4}}>{data.length}명 중 {data.filter(s=>s.today_minutes>0).length}명 공부 중</p>
      </div>

      {data.map(s => (
        <div key={s.id} onClick={()=>onStudentClick(s)} style={{background:'white',borderRadius:14,padding:'1rem 1.25rem',marginBottom:10,border:'1.5px solid',borderColor:s.today_minutes>=120?'#86efac':s.today_minutes>0?'#fde68a':'#e2e8f0',boxShadow:'0 2px 8px rgba(0,0,0,.04)',cursor:'pointer',borderLeft:`4px solid ${s.today_minutes>=120?'#10b981':s.today_minutes>0?'#f59e0b':'#e2e8f0'}`}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontWeight:700,fontSize:15}}>{s.name||'이름 미설정'}</div>
              <div style={{fontSize:12,color:'#94a3b8',marginTop:2}}>{s.phone}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:22,fontWeight:800,color:s.today_minutes>0?'#6366f1':'#cbd5e1'}}>{fmt(s.today_minutes||0)}</div>
              {s.today_minutes>=120&&<div style={{fontSize:11,color:'#10b981',fontWeight:700}}>✨ 목표 달성</div>}
            </div>
          </div>
          <div style={{marginTop:10,height:6,background:'#f1f5f9',borderRadius:3}}>
            <div style={{height:6,borderRadius:3,width:`${Math.min((s.today_minutes||0)/180*100,100)}%`,background:s.today_minutes>=120?'linear-gradient(90deg,#10b981,#34d399)':'linear-gradient(90deg,#6366f1,#8b5cf6)',transition:'width .5s'}}/>
          </div>
          <div style={{fontSize:11,color:'#94a3b8',marginTop:4,textAlign:'right'}}>탭하면 상세 보기 →</div>
        </div>
      ))}
      {data.length===0&&<p style={{textAlign:'center',color:'#94a3b8',padding:'2rem'}}>학생이 없습니다</p>}
    </div>
  );
}
