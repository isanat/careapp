import { create } from 'zustand';

export type UserRole = 'FAMILIAR' | 'CUIDADOR' | 'ADMIN';

interface UserState {
  userId: string | null;
  role: UserRole | null;
  setUser: (userId: string, role: UserRole) => void;
}

export const useUserStore = create<UserState>((set) => ({
  userId: 'demo-user',
  role: 'FAMILIAR',
  setUser: (userId, role) => set({ userId, role })
}));
