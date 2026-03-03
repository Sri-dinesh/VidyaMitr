export type GradeLevel = 'Class 6' | 'Class 7' | 'Class 8' | 'Class 9' | 'Class 10';
export type PreferredFormat = 'video' | 'text';
export type AvatarSelection = 'tech_bot' | 'explorer' | 'mentor' | 'mother' | 'father' | 'sibling';
export type Difficulty = 'Beginner' | 'Medium' | 'Advanced';
export type ActionType = 'viewed_path' | 'resource_feedback' | 'completed_module' | 'escalation_flag';

export interface User {
  id: string;
  name: string;
  grade_level: GradeLevel | null;
  preferred_format: PreferredFormat | null;
  avatar_selection: AvatarSelection | null;
  is_admin: boolean | null;
  created_at: string;
}

export interface Resource {
  id: string;
  title: string;
  subject: string;
  target_grade: string;
  difficulty: Difficulty | null;
  format: PreferredFormat | null;
  url: string;
  estimated_time: string | null;
  tags: string[] | null;
  created_at: string;
}

export interface SessionLog {
  id: string;
  user_id: string;
  action_type: ActionType;
  resource_id: string | null;
  details: Record<string, any> | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'created_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
      };
      resources: {
        Row: Resource;
        Insert: Omit<Resource, 'id' | 'created_at'>;
        Update: Partial<Omit<Resource, 'id' | 'created_at'>>;
      };
      session_logs: {
        Row: SessionLog;
        Insert: Omit<SessionLog, 'id' | 'created_at'>;
        Update: Partial<Omit<SessionLog, 'id' | 'created_at'>>;
      };
    };
  };
}
