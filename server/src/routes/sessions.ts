import { Router, Response, Request } from 'express';
import { pool } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.post('/', async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { subject, study_type, duration_minutes, workbook_name, accuracy_rate, note, session_date } = authReq.body;
  try {
    const result = await pool.query(
      `INSERT INTO study_sessions (student_id, subject, study_type, duration_minutes, workbook_name, accuracy_rate, note, session_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [authReq.user!.id, subject, study_type, duration_minutes, workbook_name, accuracy_rate, note, session_date || new Date().toISOString().split('T')[0]]
    );
    res.json(result.rows[0]);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.get('/my', async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { range, subject } = authReq.query;
  let dateFilter = '';
  if (range === 'today') dateFilter = "AND session_date = CURRENT_DATE";
  else if (range === 'week') dateFilter = "AND session_date >= CURRENT_DATE - INTERVAL '7 days'";
  else if (range === 'month') dateFilter = "AND session_date >= CURRENT_DATE - INTERVAL '30 days'";
  else if (range === 'year') dateFilter = "AND session_date >= CURRENT_DATE - INTERVAL '1 year'";
  const subjectFilter = subject ? `AND subject = '${subject}'` : '';
  try {
    const result = await pool.query(
      `SELECT * FROM study_sessions WHERE student_id = $1 ${dateFilter} ${subjectFilter} ORDER BY session_date DESC, created_at DESC`,
      [authReq.user!.id]
    );
    res.json(result.rows);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.get('/stats', async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    const [today, week, month, bySubject, dailyWeek] = await Promise.all([
      pool.query(`SELECT COALESCE(SUM(duration_minutes),0) as total FROM study_sessions WHERE student_id=$1 AND session_date=CURRENT_DATE`, [authReq.user!.id]),
      pool.query(`SELECT COALESCE(SUM(duration_minutes),0) as total FROM study_sessions WHERE student_id=$1 AND session_date>=CURRENT_DATE-7`, [authReq.user!.id]),
      pool.query(`SELECT COALESCE(SUM(duration_minutes),0) as total FROM study_sessions WHERE student_id=$1 AND session_date>=CURRENT_DATE-30`, [authReq.user!.id]),
      pool.query(`SELECT subject, SUM(duration_minutes) as total FROM study_sessions WHERE student_id=$1 AND session_date>=CURRENT_DATE-30 GROUP BY subject ORDER BY total DESC`, [authReq.user!.id]),
      pool.query(`SELECT session_date::text as date, SUM(duration_minutes) as total FROM study_sessions WHERE student_id=$1 AND session_date>=CURRENT_DATE-6 GROUP BY session_date ORDER BY session_date`, [authReq.user!.id]),
    ]);
    res.json({
      today: Number(today.rows[0].total),
      week: Number(week.rows[0].total),
      month: Number(month.rows[0].total),
      bySubject: bySubject.rows,
      dailyWeek: dailyWeek.rows,
    });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    await pool.query('DELETE FROM study_sessions WHERE id=$1 AND student_id=$2', [authReq.params['id'], authReq.user!.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

export default router;
