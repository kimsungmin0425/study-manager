import { Router } from 'express';
import { pool } from '../db.js';
import { requireStudent } from '../auth.js';

const router = Router();
router.use(requireStudent);

// KST 기준 하루 범위
function getKSTDayRange(dateStr: string) {
  const start = new Date(`${dateStr}T00:00:00+09:00`);
  const end = new Date(`${dateStr}T23:59:59+09:00`);
  return { start, end };
}

// 오늘 KST 날짜
function todayKST() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
}

router.get('/profile', async (req, res) => {
  const { studentId } = (req as any).student;
  const r = await pool.query('SELECT id, name, phone, group_id FROM students WHERE id = $1', [studentId]);
  res.json(r.rows[0] || null);
});

router.patch('/name', async (req, res) => {
  const { studentId } = (req as any).student;
  await pool.query('UPDATE students SET name=$1 WHERE id=$2', [req.body.name, studentId]);
  res.json({ ok: true });
});

// 세션 목록 (KST 날짜 기준)
router.get('/sessions', async (req, res) => {
  const { studentId } = (req as any).student;
  const { date } = req.query;
  const { start, end } = getKSTDayRange(date as string);
  const r = await pool.query(
    `SELECT * FROM study_sessions WHERE student_id=$1 AND start_time>=$2 AND start_time<=$3 ORDER BY start_time`,
    [studentId, start, end]
  );
  res.json(r.rows);
});

// 세션 생성
router.post('/sessions', async (req, res) => {
  try {
    const { studentId } = (req as any).student;
    const { subject, content, studyType, startTime, endTime, satisfaction, problemCount, correctCount, workbookName } = req.body;
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = Math.round((end.getTime() - start.getTime()) / 60000);
    if (duration <= 0) return res.status(400).json({ error: '종료 시간이 시작 시간보다 늦어야 합니다' });
    const r = await pool.query(
      `INSERT INTO study_sessions (student_id,subject,content,study_type,start_time,end_time,duration_minutes,satisfaction,problem_count,correct_count,workbook_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [studentId, subject, content||null, studyType||'concept', start, end, duration, satisfaction||null, problemCount||null, correctCount||null, workbookName||null]
    );
    res.json(r.rows[0]);
  } catch(e:any) { res.status(500).json({ error: e.message }); }
});

// 세션 수정
router.patch('/sessions/:id', async (req, res) => {
  try {
    const { studentId } = (req as any).student;
    const { subject, content, studyType, startTime, endTime, satisfaction, problemCount, correctCount, workbookName } = req.body;
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = Math.round((end.getTime() - start.getTime()) / 60000);
    if (duration <= 0) return res.status(400).json({ error: '종료 시간이 시작 시간보다 늦어야 합니다' });
    const r = await pool.query(
      `UPDATE study_sessions SET subject=$1,content=$2,study_type=$3,start_time=$4,end_time=$5,duration_minutes=$6,satisfaction=$7,problem_count=$8,correct_count=$9,workbook_name=$10
       WHERE id=$11 AND student_id=$12 RETURNING *`,
      [subject, content||null, studyType||'concept', start, end, duration, satisfaction||null, problemCount||null, correctCount||null, workbookName||null, req.params.id, studentId]
    );
    if (!r.rows[0]) return res.status(404).json({ error: '세션을 찾을 수 없습니다' });
    res.json(r.rows[0]);
  } catch(e:any) { res.status(500).json({ error: e.message }); }
});

router.delete('/sessions/:id', async (req, res) => {
  const { studentId } = (req as any).student;
  await pool.query('DELETE FROM study_sessions WHERE id=$1 AND student_id=$2', [req.params.id, studentId]);
  res.json({ ok: true });
});

// 주간 통계 (KST)
router.get('/weekly', async (req, res) => {
  const { studentId } = (req as any).student;
  const r = await pool.query(
    `SELECT TO_CHAR(start_time AT TIME ZONE 'Asia/Seoul','YYYY-MM-DD') as date, SUM(duration_minutes) as minutes
     FROM study_sessions WHERE student_id=$1 AND start_time >= NOW() - INTERVAL '7 days'
     GROUP BY 1 ORDER BY 1`,
    [studentId]
  );
  res.json(r.rows);
});

// 월간 통계 (KST)
router.get('/monthly', async (req, res) => {
  const { studentId } = (req as any).student;
  const { year, month } = req.query;
  const r = await pool.query(
    `SELECT TO_CHAR(start_time AT TIME ZONE 'Asia/Seoul','YYYY-MM-DD') as date, SUM(duration_minutes) as minutes
     FROM study_sessions WHERE student_id=$1
       AND EXTRACT(YEAR FROM start_time AT TIME ZONE 'Asia/Seoul')=$2
       AND EXTRACT(MONTH FROM start_time AT TIME ZONE 'Asia/Seoul')=$3
     GROUP BY 1 ORDER BY 1`,
    [studentId, year, month]
  );
  res.json(r.rows);
});

// 과목별 통계 (KST, 정답률 포함)
router.get('/subject-stats', async (req, res) => {
  const { studentId } = (req as any).student;
  const { year, month } = req.query;
  const r = await pool.query(
    `SELECT subject,
       SUM(duration_minutes) as total_minutes,
       COUNT(*) as session_count,
       COALESCE(SUM(problem_count),0) as total_problems,
       COALESCE(SUM(correct_count),0) as total_correct
     FROM study_sessions WHERE student_id=$1
       AND EXTRACT(YEAR FROM start_time AT TIME ZONE 'Asia/Seoul')=$2
       AND EXTRACT(MONTH FROM start_time AT TIME ZONE 'Asia/Seoul')=$3
     GROUP BY subject ORDER BY total_minutes DESC`,
    [studentId, year, month]
  );
  res.json(r.rows);
});

// 전체 과목별 누적 통계
router.get('/subject-stats-all', async (req, res) => {
  const { studentId } = (req as any).student;
  const r = await pool.query(
    `SELECT subject,
       SUM(duration_minutes) as total_minutes,
       COUNT(*) as session_count,
       COALESCE(SUM(problem_count),0) as total_problems,
       COALESCE(SUM(correct_count),0) as total_correct
     FROM study_sessions WHERE student_id=$1
     GROUP BY subject ORDER BY total_minutes DESC`,
    [studentId]
  );
  res.json(r.rows);
});

// 취침/기상
router.get('/sleep', async (req, res) => {
  const { studentId } = (req as any).student;
  const r = await pool.query('SELECT * FROM sleep_records WHERE student_id=$1 AND record_date=$2', [studentId, req.query.date]);
  res.json(r.rows[0] || null);
});

router.post('/sleep', async (req, res) => {
  const { studentId } = (req as any).student;
  const { date, bedTime, wakeTime, memo } = req.body;
  await pool.query(
    `INSERT INTO sleep_records (student_id,record_date,bed_time,wake_time,memo) VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (student_id,record_date) DO UPDATE SET bed_time=$3,wake_time=$4,memo=$5`,
    [studentId, date, bedTime||null, wakeTime||null, memo||null]
  );
  res.json({ ok: true });
});

// 공부 계획
router.get('/plans', async (req, res) => {
  const { studentId } = (req as any).student;
  const r = await pool.query('SELECT * FROM study_plans WHERE student_id=$1 AND plan_date=$2 ORDER BY created_at', [studentId, req.query.date]);
  res.json(r.rows);
});

router.post('/plans', async (req, res) => {
  try {
    const { studentId } = (req as any).student;
    const { date, subject, studyType, description, targetDuration } = req.body;
    const r = await pool.query(
      `INSERT INTO study_plans (student_id,plan_date,subject,study_type,description,target_duration) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [studentId, date, subject, studyType||'concept', description||null, targetDuration||null]
    );
    res.json(r.rows[0]);
  } catch(e:any) { res.status(500).json({ error: e.message }); }
});

router.patch('/plans/:id/complete', async (req, res) => {
  const { studentId } = (req as any).student;
  await pool.query('UPDATE study_plans SET is_completed=TRUE WHERE id=$1 AND student_id=$2', [req.params.id, studentId]);
  res.json({ ok: true });
});

router.delete('/plans/:id', async (req, res) => {
  const { studentId } = (req as any).student;
  await pool.query('DELETE FROM study_plans WHERE id=$1 AND student_id=$2', [req.params.id, studentId]);
  res.json({ ok: true });
});

// 오늘 요약
router.get('/today-summary', async (req, res) => {
  const { studentId } = (req as any).student;
  const today = todayKST();
  const { start, end } = getKSTDayRange(today);
  const [sessions, sleep, plans] = await Promise.all([
    pool.query(`SELECT * FROM study_sessions WHERE student_id=$1 AND start_time>=$2 AND start_time<=$3 ORDER BY start_time`, [studentId, start, end]),
    pool.query(`SELECT * FROM sleep_records WHERE student_id=$1 AND record_date=$2`, [studentId, today]),
    pool.query(`SELECT * FROM study_plans WHERE student_id=$1 AND plan_date=$2`, [studentId, today]),
  ]);
  const total = sessions.rows.reduce((s:number, x:any) => s + x.duration_minutes, 0);
  res.json({ sessions: sessions.rows, totalMinutes: total, sleepRecord: sleep.rows[0]||null, plans: plans.rows });
});

export default router;
