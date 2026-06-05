import { Router } from 'express';
import { pool } from '../db.js';
import { requireTeacher } from '../auth.js';
import { nanoid } from '../utils.js';

const router = Router();
router.use(requireTeacher);

function getKSTDayRange(dateStr: string) {
  const start = new Date(`${dateStr}T00:00:00+09:00`);
  const end = new Date(`${dateStr}T23:59:59+09:00`);
  return { start, end };
}
function todayKST() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
}

// 그룹 목록
router.get('/groups', async (req, res) => {
  const r = await pool.query(`SELECT g.*, COUNT(s.id) as student_count FROM groups g LEFT JOIN students s ON s.group_id=g.id GROUP BY g.id ORDER BY g.created_at DESC`);
  res.json(r.rows);
});

router.post('/groups', async (req, res) => {
  const r = await pool.query('INSERT INTO groups (name) VALUES ($1) RETURNING *', [req.body.name]);
  res.json(r.rows[0]);
});

router.delete('/groups/:id', async (req, res) => {
  await pool.query('DELETE FROM groups WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

router.get('/groups/:groupId/students', async (req, res) => {
  const r = await pool.query('SELECT * FROM students WHERE group_id=$1 ORDER BY created_at', [req.params.groupId]);
  res.json(r.rows);
});

router.post('/groups/:groupId/invite', async (req, res) => {
  const { name, phone } = req.body;
  const token = nanoid(16);
  try {
    const ex = await pool.query('SELECT id FROM students WHERE phone=$1', [phone]);
    if (ex.rows.length > 0) {
      await pool.query('UPDATE students SET invite_token=$1,token_used=FALSE,group_id=$2,name=$3 WHERE phone=$4', [token, req.params.groupId, name, phone]);
    } else {
      await pool.query('INSERT INTO students (name,phone,group_id,invite_token) VALUES ($1,$2,$3,$4)', [name, phone, req.params.groupId, token]);
    }
    const base = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    res.json({ inviteLink: `${base}/invite/${token}` });
  } catch(e:any) { res.status(400).json({ error: e.message }); }
});

router.delete('/students/:id', async (req, res) => {
  await pool.query('DELETE FROM students WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

// 학생 오늘 현황 (KST)
router.get('/students/:id/today', async (req, res) => {
  const today = todayKST();
  const { start, end } = getKSTDayRange(today);
  const [sessions, sleep] = await Promise.all([
    pool.query(`SELECT * FROM study_sessions WHERE student_id=$1 AND start_time>=$2 AND start_time<=$3 ORDER BY start_time`, [req.params.id, start, end]),
    pool.query(`SELECT * FROM sleep_records WHERE student_id=$1 AND record_date=$2`, [req.params.id, today]),
  ]);
  const total = sessions.rows.reduce((s:number, x:any) => s + x.duration_minutes, 0);
  res.json({ sessions: sessions.rows, totalMinutes: total, sleepRecord: sleep.rows[0]||null });
});

// 학생 날짜별 현황
router.get('/students/:id/date', async (req, res) => {
  const { date } = req.query;
  const { start, end } = getKSTDayRange(date as string);
  const [sessions, sleep] = await Promise.all([
    pool.query(`SELECT * FROM study_sessions WHERE student_id=$1 AND start_time>=$2 AND start_time<=$3 ORDER BY start_time`, [req.params.id, start, end]),
    pool.query(`SELECT * FROM sleep_records WHERE student_id=$1 AND record_date=$2`, [req.params.id, date]),
  ]);
  const total = sessions.rows.reduce((s:number, x:any) => s + x.duration_minutes, 0);
  res.json({ sessions: sessions.rows, totalMinutes: total, sleepRecord: sleep.rows[0]||null });
});

// 학생 월간 과목별 통계
router.get('/students/:id/subject-stats', async (req, res) => {
  const { year, month } = req.query;
  const r = await pool.query(
    `SELECT subject, SUM(duration_minutes) as total_minutes, COUNT(*) as session_count,
       COALESCE(SUM(problem_count),0) as total_problems, COALESCE(SUM(correct_count),0) as total_correct
     FROM study_sessions WHERE student_id=$1
       AND EXTRACT(YEAR FROM start_time AT TIME ZONE 'Asia/Seoul')=$2
       AND EXTRACT(MONTH FROM start_time AT TIME ZONE 'Asia/Seoul')=$3
     GROUP BY subject ORDER BY total_minutes DESC`,
    [req.params.id, year, month]
  );
  res.json(r.rows);
});

// 학생 월간 일별 통계
router.get('/students/:id/monthly', async (req, res) => {
  const { year, month } = req.query;
  const r = await pool.query(
    `SELECT TO_CHAR(start_time AT TIME ZONE 'Asia/Seoul','YYYY-MM-DD') as date, SUM(duration_minutes) as minutes
     FROM study_sessions WHERE student_id=$1
       AND EXTRACT(YEAR FROM start_time AT TIME ZONE 'Asia/Seoul')=$2
       AND EXTRACT(MONTH FROM start_time AT TIME ZONE 'Asia/Seoul')=$3
     GROUP BY 1 ORDER BY 1`,
    [req.params.id, year, month]
  );
  res.json(r.rows);
});

// 그룹 오늘 현황
router.get('/groups/:groupId/today', async (req, res) => {
  const today = todayKST();
  const { start, end } = getKSTDayRange(today);
  const students = await pool.query('SELECT * FROM students WHERE group_id=$1', [req.params.groupId]);
  const result = await Promise.all(students.rows.map(async (s:any) => {
    const r = await pool.query(
      `SELECT COALESCE(SUM(duration_minutes),0) as total FROM study_sessions WHERE student_id=$1 AND start_time>=$2 AND start_time<=$3`,
      [s.id, start, end]
    );
    return { ...s, today_minutes: parseInt(r.rows[0].total) };
  }));
  res.json(result);
});

export default router;
