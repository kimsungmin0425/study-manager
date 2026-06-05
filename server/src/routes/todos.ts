import { Router, Response } from 'express';
import { pool } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM todos WHERE student_id=$1 ORDER BY is_completed ASC, due_date ASC NULLS LAST, created_at DESC`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { title, subject, due_date } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO todos (student_id, title, subject, due_date) VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.user!.id, title, subject, due_date || null]
    );
    res.json(result.rows[0]);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const { is_completed, title, subject, due_date } = req.body;
  try {
    const result = await pool.query(
      `UPDATE todos SET is_completed=COALESCE($1,is_completed), title=COALESCE($2,title), subject=COALESCE($3,subject), due_date=COALESCE($4,due_date) WHERE id=$5 AND student_id=$6 RETURNING *`,
      [is_completed, title, subject, due_date, req.params.id, req.user!.id]
    );
    res.json(result.rows[0]);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM todos WHERE id=$1 AND student_id=$2', [req.params.id, req.user!.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

export default router;
