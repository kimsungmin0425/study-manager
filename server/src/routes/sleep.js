const { Router } = require('express');
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = Router();
router.use(authMiddleware);

router.post('/', async (req, res) => {
  const { sleep_time, wake_time, record_date } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO sleep_records (student_id, sleep_time, wake_time, record_date) VALUES ($1,$2,$3,$4) ON CONFLICT (student_id, record_date) DO UPDATE SET sleep_time=$2, wake_time=$3 RETURNING *`,
      [req.user.id, sleep_time, wake_time, record_date || new Date().toISOString().split('T')[0]]
    );
    res.json(result.rows[0]);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.get('/my', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM sleep_records WHERE student_id=$1 ORDER BY record_date DESC LIMIT 30`, [req.user.id]);
    res.json(result.rows);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
