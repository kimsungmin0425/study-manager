import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        phone VARCHAR(20) UNIQUE NOT NULL,
        group_id INTEGER REFERENCES groups(id),
        invite_token VARCHAR(100) UNIQUE,
        token_used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS study_sessions (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        subject VARCHAR(100) NOT NULL,
        content TEXT,
        study_type VARCHAR(20) DEFAULT 'concept',
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        duration_minutes INTEGER NOT NULL,
        satisfaction VARCHAR(10),
        problem_count INTEGER,
        correct_count INTEGER,
        workbook_name VARCHAR(200),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS study_plans (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        plan_date DATE NOT NULL,
        subject VARCHAR(100) NOT NULL,
        study_type VARCHAR(20) DEFAULT 'concept',
        description TEXT,
        target_duration INTEGER,
        is_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sleep_records (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        record_date DATE NOT NULL,
        bed_time VARCHAR(10),
        wake_time VARCHAR(10),
        memo TEXT,
        UNIQUE(student_id, record_date)
      );
    `);
    console.log('DB 테이블 초기화 완료');
  } finally {
    client.release();
  }
}
