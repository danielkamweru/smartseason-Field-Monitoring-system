export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'agent';
  created_at?: string;
}

export interface Field {
  id: number;
  name: string;
  crop_type: string;
  planting_date: string;
  current_stage: 'planted' | 'growing' | 'ready' | 'harvested';
  status: 'active' | 'at_risk' | 'completed';
  assigned_agent_id?: number | null;
  agent_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FieldUpdate {
  id: number;
  field_id: number;
  agent_id: number;
  stage: 'planted' | 'growing' | 'ready' | 'harvested';
  notes?: string;
  update_date: string;
  created_at?: string;
  agent_name?: string;
}

export interface Agent {
  id: number;
  username: string;
  email: string;
  created_at?: string;
}

export interface AgentStats {
  id: number;
  username: string;
  field_count: number;
}

export interface DashboardStats {
  totalFields: number;
  statusBreakdown: Array<{
    status: string;
    count: number;
  }>;
  stageBreakdown: Array<{
    current_stage: string;
    count: number;
  }>;
  agentStats?: Array<AgentStats>;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (credentials: any) => Promise<{ success: boolean; error?: string }>;
  register: (userData: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  clearError: () => void;
}

export interface LayoutProps {
  children: React.ReactNode;
}
