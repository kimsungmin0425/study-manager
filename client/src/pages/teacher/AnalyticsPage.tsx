import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { Group } from '../../types';
import { BarChart2, Users, ChevronRight } from 'lucide-react';

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => { api.get('/groups/my').then(res => setGroups(res.data)); }, []);

  return (
    <div style={{ padding: '0 0 24px' }} className="fade-in">
      <div className="page-header">
        <h1 className="page-title">분석</h1>
        <p className="page-subtitle">그룹을 선택해 학생 상세 분석을 확인하세요</p>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {groups.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
            <BarChart2 size={40} color="var(--text-tertiary)" style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ fontWeight: 700, marginBottom: 8 }}>그룹이 없어요</p>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 16 }}>그룹을 만들고 학생을 추가하면 분석이 가능해요</p>
            <button onClick={() => navigate('/teacher/groups')} className="btn btn-primary">그룹 만들기</button>
          </div>
        ) : (
          groups.map(group => (
            <div key={group.id} className="card card-clickable"
              onClick={() => navigate(`/teacher/groups/${group.id}`)}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: 'var(--primary)', flexShrink: 0 }}>
                {group.name.slice(0,1)}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: 15 }}>{group.name}</p>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{group.member_count}명의 학생</p>
              </div>
              <ChevronRight size={18} color="var(--text-tertiary)" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
