import type { Schedule, Action, Job, JobTemplate, ApiResponse, PaginatedResponse } from '@/types';

// Mock data for schedules
export const mockSchedules: Schedule[] = [
  {
    id: 1,
    name: 'Daily Backup',
    description: 'Backup database every day at midnight',
    action_id: 1,
    user_id: 1,
    schedule_type: 'recurring',
    cron_expression: '0 0 * * *',
    state: 'scheduled',
    is_active: true,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Weekly Report',
    description: 'Generate weekly analytics report',
    action_id: 2,
    user_id: 1,
    schedule_type: 'recurring',
    cron_expression: '0 9 * * 1',
    state: 'scheduled',
    is_active: true,
    created_at: '2024-02-02T00:00:00Z',
    updated_at: '2024-02-02T00:00:00Z',
  },
  {
    id: 3,
    name: 'Monthly Cleanup',
    description: 'Clean up old logs and temporary files',
    action_id: 3,
    user_id: 1,
    schedule_type: 'recurring',
    cron_expression: '0 2 1 * *',
    state: 'scheduled',
    is_active: true,
    created_at: '2024-02-03T00:00:00Z',
    updated_at: '2024-02-03T00:00:00Z',
  },
  {
    id: 4,
    name: 'System Health Check',
    description: 'Check system health every 5 minutes',
    action_id: 4,
    user_id: 1,
    schedule_type: 'relative',
    interval_seconds: 300,
    state: 'scheduled',
    is_active: true,
    created_at: '2024-02-04T00:00:00Z',
    updated_at: '2024-02-04T00:00:00Z',
  },
  {
    id: 5,
    name: 'One-time Migration',
    description: 'Run database migration on specific date',
    action_id: 5,
    user_id: 1,
    schedule_type: 'absolute',
    schedule_time: '2024-03-01T10:00:00Z',
    state: 'pending',
    is_active: false,
    created_at: '2024-02-05T00:00:00Z',
    updated_at: '2024-02-05T00:00:00Z',
  },
];

// Mock data for actions
export const mockActions: Action[] = [
  {
    id: 1,
    name: 'Database Backup',
    description: 'Backup all databases to S3',
    user_id: 1,
    is_active: true,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Send Analytics Report',
    description: 'Generate and email weekly analytics',
    user_id: 1,
    is_active: true,
    created_at: '2024-02-02T00:00:00Z',
    updated_at: '2024-02-02T00:00:00Z',
  },
  {
    id: 3,
    name: 'Cleanup Task',
    description: 'Remove old logs and temp files',
    user_id: 1,
    is_active: true,
    created_at: '2024-02-03T00:00:00Z',
    updated_at: '2024-02-03T00:00:00Z',
  },
  {
    id: 4,
    name: 'Health Monitor',
    description: 'Check service health and alert on issues',
    user_id: 1,
    is_active: true,
    created_at: '2024-02-04T00:00:00Z',
    updated_at: '2024-02-04T00:00:00Z',
  },
  {
    id: 5,
    name: 'Data Migration',
    description: 'Migrate data to new schema',
    user_id: 1,
    is_active: false,
    created_at: '2024-02-05T00:00:00Z',
    updated_at: '2024-02-05T00:00:00Z',
  },
];

// Mock data for jobs
export const mockJobs: Job[] = [
  {
    id: 1,
    action_id: 1,
    job_template_id: 1,
    name: 'Backup MySQL',
    description: 'Backup MySQL database',
    input_params: { database: 'cronny_prod' },
    state: 'completed',
    execution_order: 1,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  },
];

// Mock data for job templates
export const mockJobTemplates: JobTemplate[] = [
  {
    id: 1,
    name: 'HTTP Request',
    description: 'Make an HTTP request',
    type: 'http',
    input_schema: { url: 'string', method: 'string' },
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  },
];

// Helper function to wrap data in API response format
export function mockApiResponse<T>(data: T): ApiResponse<T> {
  return {
    data,
    message: 'Mock data',
  };
}

export function mockPaginatedResponse<T>(data: T[]): PaginatedResponse<T> {
  return {
    data,
    total: data.length,
    page: 1,
    per_page: 10,
  };
}

// Mock API responses by resource
export const mockApiData = {
  schedules: mockSchedules,
  actions: mockActions,
  jobs: mockJobs,
  job_templates: mockJobTemplates,
};
