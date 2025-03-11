import api from './api';

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
}

export interface JobResponse {
  message: string;
  job: Job;
}

export interface JobsResponse {
  message: string;
  jobs: Job[];
}

class JobService {
  async getJobs(): Promise<Job[]> {
    const response = await api.get<JobsResponse>('/jobs');
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
}

export default new JobService();