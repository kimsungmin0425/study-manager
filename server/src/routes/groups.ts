import { Router, Response, Request } from 'express';
import { pool } from '../db';
import { authMiddleware, teacherOnly, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.post('/', teacherOnly, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { name } = authReq.body;
  const invite_code = Math.random().toString(36).substring(2, 8).toUpperCase();
  try {
    const result = await pool.query(
      `INSERT INTO groups (name, teacher_id, invite_code) VALUES ($1,$2,$3) RETURNING *`,
      [name, authReq.user!.id, invite_code]
    );
    res.json(result.rows[0]);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.get('/my', teacherOnly, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    const result = await pool.query(
      `SELECT g.*, COUNT(gm.id)::int as member_count
       FROM groups g LEFT JOIN group_members gm ON g.id=gm.group_id
       WHERE g.teacher_id=$1 GROUP BY g.id ORDER BY g.created_at DESC`,
      [authReq.user!.id]
    );
    res.json(result.rows);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/join', async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { invite_code } = authReq.body;
  try {
    const group = await pool.query(`SELECT * FROM groups WHERE invite_code=$1`, [invite_code]);
    if (!group.rows[0]) return res.status(404).json({ error: '유효하지 않은 초대 코드입니다' });
    await pool.query(
      `INSERT INTO group_members (group_id, student_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [group.rows[0].id, authReq.user!.id]
    );
    res.json({ success: true, group: group.rows[0] });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.get('/:groupId/members', teacherOnly, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, gm.joined_at FROM users u
       JOIN group_members gm ON u.id=gm.student_id
       JOIN groups g ON gm.group_id=g.id
       WHERE gm.group_id=$1 AND g.teacher_id=$2`,
      [authReq.params['groupId'], authReq.user!.id]
    );
    res.json(result.rows);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.get('/student/:studentId/dashboard', teacherOnly, async (req: Request, res: Response) => {
  const { studentId } = req.params;
  try {
    const [info, stats, sessions, sleep, todos, monthly, subjectStats] = await Promise.all([
      pool.query(`SELECT id, name, email FROM users WHERE id=$1`, [studentId]),
      pool.query(`SELECT 
        COALESCE(SUM(CASE WHEN session_date=CURRENT_DATE THEN duration_minutes END),0) as today,
        COALESCE(SUM(CASE WHEN session_date>=CURRENT_DATE-7 THEN duration_minutes END),0) as week,
        COALESCE(SUM(CASE WHEN session_date>=CURRENT_DATE-30 THEN duration_minutes END),0) as month
        FROM study_sessions WHERE student_id=$1`, [studentId]),
      pool.query(`SELECT * FROM study_sessions WHERE student_id=$1 ORDER BY session_date DESC LIMIT 50`, [studentId]),
      pool.query(`SELECT * FROM sleep_records WHERE student_id=$1 ORDER BY record_date DESC LIMIT 30`, [studentId]),
      pool.query(`SELECT * FROM todos WHERE student_id=$1 ORDER BY is_completed ASC, created_at DESC`, [studentId]),
      pool.query(`SELECT TO_CHAR(session_date,'YYYY-MM') as month, SUM(duration_minutes) as total FROM study_sessions WHERE student_id=$1 AND session_date>=CURRENT_DATE-365 GROUP BY month ORDER BY month`, [studentId]),
      pool.query(`SELECT subject, SUM(duration_minutes) as total, COUNT(*) as sessions FROM study_sessions WHERE student_id=$1 AND session_date>=CURRENT_DATE-30 GROUP BY subject ORDER BY total DESC`, [studentId]),
    ]);
    res.json({
      info: info.rows[0],
      stats: stats.rows[0],
      sessions: sessions.rows,
      sleep: sleep.rows,
      todos: todos.rows,
      monthly: monthly.rows,
      subjectStats: subjectStats.rows,
    });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', teacherOnly, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    await pool.query('DELETE FROM groups WHERE id=$1 AND teacher_id=$2', [authReq.params['id'], authReq.user!.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

export default router;
