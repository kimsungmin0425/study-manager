export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher';
}

export interface StudySession {
  id: string;
  student_id: string;
  subject: string;
  study_type: string;
  duration_minutes: number;
  workbook_name?: string;
  accuracy_rate?: number;
  note?: string;
  session_date: string;
  created_at: string;
}

export interface SleepRecord {
  id: string;
  student_id: string;
  sleep_time: string;
  wake_time: string;
  record_date: string;
}

export interface Todo {
  id: string;
  student_id: string;
  title: string;
  subject?: string;
  due_date?: string;
  is_completed: boolean;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  teacher_id: string;
  invite_code: string;
  member_count: number;
  created_at: string;
}

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  joined_at: string;
}

export interface Stats {
  today: number;
  week: number;
  month: number;
  bySubject: { subject: string; total: number }[];
  dailyWeek: { date: string; total: number }[];
}

export const STUDY_TYPES = [
  '개념 학습',
  '문제 풀이',
  '오답 노트',
  '복습',
  '예습',
  '모의고사',
  '단어 암기',
  '독해',
  '듣기',
  '글쓰기',
] as const;

export const SUBJECTS = [
  '수학', '국어', '영어', '과학', '사회',
  '한국사', '물리', '화학', '생물', '지구과학',
  '세계사', '경제', '정치', '독서', '문학', '기타'
] as const;

export const SUBJECT_COLORS: Record<string, string> = {
  '수학': '#4A7CF7',
  '국어': '#22C55E',
  '영어': '#F97316',
  '과학': '#A855F7',
  '사회': '#14B8A6',
  '한국사': '#EF4444',
  '물리': '#6366F1',
  '화학': '#EC4899',
  '생물': '#84CC16',
  '지구과학': '#06B6D4',
  '기타': '#9CA3AF',
};
