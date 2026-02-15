// Base model that all entities extend
export interface BaseModel {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// Schedule types
export interface Schedule extends BaseModel {
  name: string;
  description?: string;
  action_id: number;
  user_id: number;
  schedule_type: 'absolute' | 'recurring' | 'relative';
  schedule_time?: string;
  cron_expression?: string;
  interval_seconds?: number;
  state: 'pending' | 'scheduled' | 'processed';
  is_active: boolean;
}

// Action types
export interface Action extends BaseModel {
  name: string;
  description?: string;
  user_id: number;
  is_active: boolean;
  jobs?: Job[];
}

// Job types
export interface Job extends BaseModel {
  action_id: number;
  job_template_id: number;
  name: string;
  description?: string;
  input_params: Record<string, unknown>;
  output_params?: Record<string, unknown>;
  state: 'pending' | 'running' | 'completed' | 'failed';
  execution_order: number;
}

// JobTemplate types
export interface JobTemplate extends BaseModel {
  name: string;
  description?: string;
  type: 'http' | 'slack' | 'docker' | 'logger' | 'email';
  input_schema: Record<string, unknown>;
  output_schema?: Record<string, unknown>;
}

// Trigger types
export interface Trigger extends BaseModel {
  schedule_id: number;
  trigger_time: string;
  state: 'scheduled' | 'executing' | 'completed' | 'failed';
  error_message?: string;
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  message: string;
  status: number;
}
