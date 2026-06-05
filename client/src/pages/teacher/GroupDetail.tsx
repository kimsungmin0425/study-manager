import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { GroupMember } from '../../types';
import { ArrowLeft, ChevronRight, UserCircle } from 'lucide-react';

export default function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (groupId) {
      api.get(`/groups/${groupId}/members`)
        .then(res => setMembers(res.data))
        .finally(() => setLoading(false));
    }
  }, [groupId]);

  return (
    <div style={{ padding: '0 0 24px' }} className="fade-in">
      <div className="page-header">
        <button onClick={() => navigate('/teacher/groups')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)', fontWeight: 600, fontSize: 14, marginBottom: 12, padding: 0 }}>
          <ArrowLeft size={18} />뒤로
        </button>
        <h1 className="page-title">학생 목록</h1>
        <p className="page-subtitle">{members.length}명</p>
      </div>

      <div style={{ padding: '0 16px' }}>
        <div className="card">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 60, marginBottom: 10, borderRadius: 12 }} />)
          ) : members.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
              <UserCircle size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p>아직 학생이 없어요</p>
              <p style={{ fontSize: 12, marginTop: 6 }}>초대 코드를 공유해서 학생을 추가하세요</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {members.map(m => (
                <div key={m.id} onClick={() => navigate(`/teacher/student/${m.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', borderRadius: 12, background: 'var(--bg)', cursor: 'pointer' }}
                  className="card-clickable">
                  <div style={{ width: 40, height: 40, borderRadius: 50, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'var(--primary)' }}>
                    {m.name.slice(0,1)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 14 }}>{m.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{m.email}</p>
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
