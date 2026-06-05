import { Router } from 'express';
import { pool } from '../db.js';
import { signToken, verifyToken } from '../auth.js';
import { nanoid } from '../utils.js';

const router = Router();

// 선생님 로그인
router.post('/teacher-login', async (req, res) => {
  const { password } = req.body;
  const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD || 'teacher1234';
  if (password !== TEACHER_PASSWORD) return res.status(401).json({ error: '비밀번호가 틀렸습니다' });
  const token = signToken({ role: 'teacher', name: '선생님' });
  res.cookie('token', token, { httpOnly: true, maxAge: 30*24*60*60*1000, sameSite: 'lax' });
  res.json({ ok: true, role: 'teacher' });
});

// 학생 초대 링크로 로그인
router.post('/student-invite', async (req, res) => {
  const { token } = req.body;
  const result = await pool.query('SELECT * FROM students WHERE invite_token = $1', [token]);
  if (!result.rows[0]) return res.status(404).json({ error: '유효하지 않은 초대 링크입니다' });
  const student = result.rows[0];
  if (!student.token_used) {
    await pool.query('UPDATE students SET token_used = TRUE WHERE id = $1', [student.id]);
  }
  const jwt = signToken({ role: 'student', studentId: student.id, name: student.name || '학생' });
  res.cookie('token', jwt, { httpOnly: true, maxAge: 365*24*60*60*1000, sameSite: 'lax' });
  res.json({ ok: true, role: 'student', studentId: student.id });
});

// 현재 로그인 상태
router.get('/me', (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.json({ loggedIn: false });
  try {
    const payload = verifyToken(token);
    res.json({ loggedIn: true, role: payload.role, studentId: payload.studentId, name: payload.name });
  } catch {
    res.json({ loggedIn: false });
  }
});

// 로그아웃
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

export default router;
