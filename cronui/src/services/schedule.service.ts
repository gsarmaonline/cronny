import api from './api';

export interface Schedule {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  name: string;
  schedule_exec_type: number;
  string: string;
  schedule_type: number;
  schedule_value: string;
  schedule_unit: string;
  schedule_status: number;
  ends_at: string;
  action_id: number;
}

export interface ScheduleResponse {
  message: string;
  schedule: Schedule;
}

export interface SchedulesResponse {
  message: string;
  schedules: Schedule[];
}

class ScheduleService {
  async getSchedules(): Promise<Schedule[]> {
    const response = await api.get<SchedulesResponse>('/schedules');
    return response.data.schedules;
  }

  async getSchedule(id: number): Promise<Schedule> {
    const response = await api.get<ScheduleResponse>(`/schedules/${id}`);
    return response.data.schedule;
  }

  async createSchedule(schedule: Partial<Schedule>): Promise<Schedule> {
    const response = await api.post<ScheduleResponse>('/schedules', schedule);
    return response.data.schedule;
  }

  async updateSchedule(id: number, schedule: Partial<Schedule>): Promise<Schedule> {
    const response = await api.put<ScheduleResponse>(`/schedules/${id}`, schedule);
    return response.data.schedule;
  }

  async deleteSchedule(id: number): Promise<void> {
    await api.delete(`/schedules/${id}`);
  }
}

export default new ScheduleService();