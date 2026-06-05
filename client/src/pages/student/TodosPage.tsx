import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Todo, SUBJECTS } from '../../types';
import { Plus, X, CheckCircle2, Circle, Trash2 } from 'lucide-react';

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('수학');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get('/todos').then(res => setTodos(res.data)); }, []);

  const handleAdd = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/todos', { title, subject, due_date: dueDate || undefined });
      setTodos(prev => [res.data, ...prev]);
      setTitle(''); setDueDate(''); setShowForm(false);
    } finally { setLoading(false); }
  };

  const toggleTodo = async (todo: Todo) => {
    const res = await api.patch(`/todos/${todo.id}`, { is_completed: !todo.is_completed });
    setTodos(prev => prev.map(t => t.id === todo.id ? res.data : t).sort((a,b) => Number(a.is_completed) - Number(b.is_completed)));
  };

  const deleteTodo = async (id: string) => {
    await api.delete(`/todos/${id}`);
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  const pending = todos.filter(t => !t.is_completed);
  const completed = todos.filter(t => t.is_completed);

  return (
    <div style={{ padding: '0 0 24px' }} className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">공부 계획</h1>
            <p className="page-subtitle">{pending.length}개 진행중 · {completed.length}개 완료</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} />추가
          </button>
        </div>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Progress */}
        {todos.length > 0 && (
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>전체 완료율</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
                {Math.round((completed.length / todos.length) * 100)}%
              </span>
            </div>
            <div style={{ height: 8, background: 'var(--bg-card2)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%', background: 'var(--primary)', borderRadius: 99,
                width: `${(completed.length / todos.length) * 100}%`,
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        )}

        {/* Pending */}
        {pending.length > 0 && (
          <div className="card">
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>할 일 ({pending.length})</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pending.map(todo => <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} onDelete={deleteTodo} />)}
            </div>
          </div>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <div className="card">
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: 'var(--text-tertiary)' }}>완료 ({completed.length})</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {completed.map(todo => <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} onDelete={deleteTodo} />)}
            </div>
          </div>
        )}

        {todos.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <CheckCircle2 size={40} color="var(--text-tertiary)" style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ fontWeight: 700, marginBottom: 6 }}>계획을 세워볼까요?</p>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 16 }}>오늘 공부할 내용을 계획해보세요</p>
            <button onClick={() => setShowForm(true)} className="btn btn-primary">계획 추가하기</button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>공부 계획 추가</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label">할 일</label>
                <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="예: 수학 2단원 복습" autoFocus />
              </div>
              <div>
                <label className="label">과목</label>
                <select className="input" value={subject} onChange={e => setSubject(e.target.value)}>
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">기한 (선택)</label>
                <input className="input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
              <button className="btn btn-primary" disabled={loading} onClick={handleAdd}
                style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15 }}>
                {loading ? '추가 중...' : '추가하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TodoItem({ todo, onToggle, onDelete }: { todo: Todo; onToggle: (t: Todo) => void; onDelete: (id: string) => void }) {
  const isOverdue = todo.due_date && new Date(todo.due_date) < new Date() && !todo.is_completed;
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '10px 12px', borderRadius: 12,
      background: todo.is_completed ? 'var(--border-light)' : 'var(--bg)',
      opacity: todo.is_completed ? 0.65 : 1,
    }}>
      <button onClick={() => onToggle(todo)} style={{ background: 'none', border: 'none', color: todo.is_completed ? 'var(--accent-green)' : 'var(--text-tertiary)', marginTop: 1, flexShrink: 0 }}>
        {todo.is_completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, textDecoration: todo.is_completed ? 'line-through' : 'none' }}>{todo.title}</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 3 }}>
          {todo.subject && <span className="badge badge-blue" style={{ fontSize: 10 }}>{todo.subject}</span>}
          {todo.due_date && (
            <span style={{ fontSize: 11, color: isOverdue ? '#EF4444' : 'var(--text-tertiary)' }}>
              {isOverdue ? '⚠️ ' : ''}{todo.due_date}
            </span>
          )}
        </div>
      </div>
      <button onClick={() => onDelete(todo.id)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', flexShrink: 0 }}>
        <Trash2 size={14} />
      </button>
    </div>
  );
}
