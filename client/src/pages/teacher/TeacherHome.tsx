import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuthStore } from '../../hooks/useAuthStore';
import { Group, GroupMember } from '../../types';
import { Users, Plus, ChevronRight, TrendingUp, BookOpen } from 'lucide-react';

export default function TeacherHome() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/groups/my').then(res => setGroups(res.data)).finally(() => setLoading(false));
  }, []);

  const totalStudents = groups.reduce((a, g) => a + g.member_count, 0);

  return (
    <div style={{ padding: '0 0 24px' }} className="fade-in">
      <div className="page-header">
        <h1 className="page-title">안녕하세요, {user?.name}님</h1>
        <p className="page-subtitle">총 {groups.length}개 그룹 · {totalStudents}명의 학생</p>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="card" style={{ padding: '20px 16px', textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <Users size={20} color="var(--primary)" />
            </div>
            <p style={{ fontSize: 24, fontWeight: 800 }}>{totalStudents}</p>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>전체 학생</p>
          </div>
          <div className="card" style={{ padding: '20px 16px', textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <BookOpen size={20} color="#16A34A" />
            </div>
            <p style={{ fontSize: 24, fontWeight: 800 }}>{groups.length}</p>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>그룹 수</p>
          </div>
        </div>

        {/* Groups */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ fontWeight: 700, fontSize: 15 }}>내 그룹</p>
            <button onClick={() => navigate('/teacher/groups')} className="btn btn-primary" style={{ padding: '7px 12px', fontSize: 13 }}>
              <Plus size={14} />그룹 추가
            </button>
          </div>
          {groups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)' }}>
              <Users size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p style={{ fontSize: 14, marginBottom: 12 }}>아직 그룹이 없어요</p>
              <button onClick={() => navigate('/teacher/groups')} className="btn btn-primary">그룹 만들기</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {groups.map(group => (
                <div key={group.id} onClick={() => navigate(`/teacher/groups/${group.id}`)} className="card-clickable"
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', borderRadius: 12, background: 'var(--bg)', cursor: 'pointer' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: 'var(--primary)' }}>
                    {group.name.slice(0,1)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 14 }}>{group.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{group.member_count}명 · 코드: {group.invite_code}</p>
                  </div>
                  <ChevronRight size={16} color="var(--text-tertiary)" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
