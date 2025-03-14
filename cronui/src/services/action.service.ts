import api from './api';

export interface Action {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  name: string;
  description?: string;
  user_id: number;
}

export interface ActionResponse {
  data: Action;
  message: string;
}

export interface ActionsResponse {
  data: Action[];
  message: string;
}

class ActionService {
  async getActions(): Promise<Action[]> {
    const response = await api.get<ActionsResponse>('/actions');
    return response.data.data;
  }

  async getAction(id: number): Promise<Action> {
    const response = await api.get<ActionResponse>(`/actions/${id}`);
    return response.data.data;
  }

  async createAction(action: Partial<Action>): Promise<Action> {
    const response = await api.post<ActionResponse>('/actions', action);
    return response.data.data;
  }

  async updateAction(id: number, action: Partial<Action>): Promise<Action> {
    const response = await api.put<ActionResponse>(`/actions/${id}`, action);
    return response.data.data;
  }

  async deleteAction(id: number): Promise<void> {
    await api.delete(`/actions/${id}`);
  }
}

export default new ActionService();