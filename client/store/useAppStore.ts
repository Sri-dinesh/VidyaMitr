import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GradeLevel, PreferredFormat, AvatarSelection } from '@/types/database.types';

// User State Interface
export interface UserState {
  id: string | null;
  name: string | null;
  grade_level: GradeLevel | null;
  preferred_format: PreferredFormat | null;
  avatar_selection: AvatarSelection | null;
}

// Intent State Interface
export interface IntentState {
  subject: string | null;
  goal: string | null;
  confidence: string | null;
}

// Combined Store State
interface AppState {
  user: UserState;
  intent: IntentState;
  setUser: (user: UserState) => void;
  setIntent: (intent: IntentState) => void;
  clearSession: () => void;
}

// Initial States
const initialUserState: UserState = {
  id: null,
  name: null,
  grade_level: null,
  preferred_format: null,
  avatar_selection: null,
};

const initialIntentState: IntentState = {
  subject: null,
  goal: null,
  confidence: null,
};

// Create Zustand Store with Persistence
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: initialUserState,
      intent: initialIntentState,

      setUser: (user: UserState) =>
        set(() => ({
          user,
        })),

      setIntent: (intent: IntentState) =>
        set(() => ({
          intent,
        })),

      clearSession: () =>
        set(() => ({
          user: initialUserState,
          intent: initialIntentState,
        })),
    }),
    {
      name: 'vidyamitra-storage',
      partialize: (state) => ({
        user: state.user,
        intent: state.intent,
      }),
    }
  )
);
