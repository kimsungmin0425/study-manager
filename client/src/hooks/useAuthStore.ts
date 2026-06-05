import { create } from 'zustand';
import { User } from '../types';
import api from '../utils/api';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })(),
  token: localStorage.getItem('token'),
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      set({ user: res.data.user, token: res.data.token, loading: false });
    } catch (err: any) {
      set({ loading: false });
      throw new Error(err.response?.data?.error || '로그인에 실패했습니다');
    }
  },

  register: async (name, email, password, role) => {
    set({ loading: true });
    try {
      const res = await api.post('/auth/register', { name, email, password, role });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      set({ user: res.data.user, token: res.data.token, loading: false });
    } catch (err: any) {
      set({ loading: false });
      throw new Error(err.response?.data?.error || '회원가입에 실패했습니다');
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },
}));
