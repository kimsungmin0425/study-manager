import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

const SECRET = process.env.JWT_SECRET || 'dev-secret-key';

export function signToken(payload: object) {
  return jwt.sign(payload, SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string) {
  return jwt.verify(token, SECRET) as any;
}

export function requireTeacher(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '로그인이 필요합니다' });
  try {
    const payload = verifyToken(token);
    if (payload.role !== 'teacher') return res.status(403).json({ error: '선생님만 접근 가능합니다' });
    (req as any).teacher = payload;
    next();
  } catch {
    res.status(401).json({ error: '토큰이 유효하지 않습니다' });
  }
}

export function requireStudent(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '로그인이 필요합니다' });
  try {
    const payload = verifyToken(token);
    if (payload.role !== 'student') return res.status(403).json({ error: '학생만 접근 가능합니다' });
    (req as any).student = payload;
    next();
  } catch {
    res.status(401).json({ error: '토큰이 유효하지 않습니다' });
  }
}
