import api from './api';

export interface JobExecution {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  job_id: number;
  output: string;
  execution_start_time: string;
  execution_stop_time: string;
}

export interface JobTemplate {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  name: string;
}

export interface Job {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  name: string;
  job_type: string;
  job_input_type: string;
  job_input_value: string;
  action_id: number;
  job_template_id: number;
  condition: string;
  is_root_job: boolean;
  proceed_condition: string;
  job_timeout_in_secs: number;
  job_executions: JobExecution[];
}

export interface JobResponse {
  message: string;
  job: Job;
}

export interface JobsResponse {
  message: string;
  jobs: Job[];
}

export interface JobTemplatesResponse {
  message: string;
  job_templates: JobTemplate[];
}

class JobService {
  async getJobs(actionId?: number): Promise<Job[]> {
    const url = actionId ? `/jobs?action_id=${actionId}` : '/jobs';
    const response = await api.get<JobsResponse>(url);
    return response.data.jobs;
  }

  async getJob(id: number): Promise<Job> {
    const response = await api.get<JobResponse>(`/jobs/${id}`);
    return response.data.job;
  }

  async createJob(job: Partial<Job>): Promise<Job> {
    const response = await api.post<JobResponse>('/jobs', job);
    return response.data.job;
  }

  async updateJob(id: number, job: Partial<Job>): Promise<Job> {
    const response = await api.put<JobResponse>(`/jobs/${id}`, job);
    return response.data.job;
  }

  async deleteJob(id: number): Promise<void> {
    await api.delete(`/jobs/${id}`);
  }

  async getJobTemplates(): Promise<JobTemplate[]> {
    try {
      const response = await api.get<JobTemplatesResponse>('/job_templates');
      console.log('Job templates response:', response);
      return response.data.job_templates || [];
    } catch (err) {
      console.error('Error fetching job templates:', err);
      return [];
    }
  }
}

export default new JobService();