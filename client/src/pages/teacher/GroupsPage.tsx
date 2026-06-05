import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { Group } from '../../types';
import { Plus, X, Copy, Users, Trash2, ChevronRight } from 'lucide-react';

export default function GroupsPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => { api.get('/groups/my').then(res => setGroups(res.data)); }, []);

  const handleCreate = async () => {
    if (!groupName.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/groups', { name: groupName });
      setGroups(prev => [res.data, ...prev]);
      setGroupName(''); setShowForm(false);
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('그룹을 삭제할까요? 모든 멤버 데이터가 삭제됩니다.')) return;
    await api.delete(`/groups/${id}`);
    setGroups(prev => prev.filter(g => g.id !== id));
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div style={{ padding: '0 0 24px' }} className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">그룹 관리</h1>
            <p className="page-subtitle">{groups.length}개 그룹</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} />새 그룹
          </button>
        </div>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {groups.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <Users size={48} color="var(--text-tertiary)" style={{ margin: '0 auto 16px', opacity: 0.4 }} />
            <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>그룹을 만들어 학생을 관리하세요</p>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 20 }}>그룹을 생성하면 초대 코드로 학생을 추가할 수 있어요</p>
            <button onClick={() => setShowForm(true)} className="btn btn-primary">첫 그룹 만들기</button>
          </div>
        ) : (
          groups.map(group => (
            <div key={group.id} className="card">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>
                    {group.name.slice(0,1)}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15 }}>{group.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>학생 {group.member_count}명</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(group.id)} className="btn btn-danger" style={{ padding: '6px 10px', fontSize: 12 }}>
                  <Trash2 size={13} />삭제
                </button>
              </div>

              {/* Invite code */}
              <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '12px 14px', marginBottom: 12 }}>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>초대 코드</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '4px', color: 'var(--primary)' }}>{group.invite_code}</span>
                  <button onClick={() => copyCode(group.invite_code)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
                    <Copy size={13} />
                    {copied === group.invite_code ? '복사됨!' : '복사'}
                  </button>
                </div>
              </div>

              <button onClick={() => navigate(`/teacher/groups/${group.id}`)} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'space-between', padding: '11px 14px' }}>
                <span>학생 목록 보기</span>
                <ChevronRight size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>새 그룹 만들기</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label">그룹 이름</label>
                <input className="input" value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="예: 2024 수학 심화반" autoFocus onKeyDown={e => e.key === 'Enter' && handleCreate()} />
              </div>
              <button className="btn btn-primary" disabled={loading} onClick={handleCreate}
                style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15 }}>
                {loading ? '생성 중...' : '그룹 만들기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
