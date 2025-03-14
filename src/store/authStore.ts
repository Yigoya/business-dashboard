import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

// Initialize with token from localStorage
const storedToken = localStorage.getItem('token');
const storedUser = localStorage.getItem('user');
console.log('Auth store initializing with token:', !!storedToken);

const useAuthStore = create<AuthState>((set) => ({
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken,
  setAuth: (user, token) => {
    console.log('Setting auth with user:', user);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token });
  },
  logout: () => {
    console.log('Logging out user');
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));

export default useAuthStore;