import api from './api';

export interface User {
  ID: number;
  Username: string;
  Email: string;
  AvatarURL: string;
  FirstName: string;
  LastName: string;
  Address: string;
  City: string;
  State: string;
  Country: string;
  ZipCode: string;
  Phone: string;
  PlanID: number;
  Plan: Plan;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface Plan {
  ID: number;
  Name: string;
  Type: string;
  Price: number;
  Description: string;
  Features: Feature[];
  CreatedAt: string;
  UpdatedAt: string;
}

export interface Feature {
  ID: number;
  Name: string;
  Description: string;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface UserProfileUpdate {
  FirstName: string;
  LastName: string;
  Address: string;
  City: string;
  State: string;
  Country: string;
  ZipCode: string;
  Phone: string;
}

export interface UserPlanUpdate {
  PlanID: number;
}

export interface UserResponse {
  user: User;
  message: string;
}

export interface PlansResponse {
  plans: Plan[];
  message: string;
}

class UserService {
  async getProfile(): Promise<User> {
    const response = await api.get<UserResponse>('/user/profile');
    return response.data.user;
  }

  async updateProfile(profile: UserProfileUpdate): Promise<User> {
    const response = await api.put<UserResponse>('/user/profile', profile);
    return response.data.user;
  }

  async updatePlan(planUpdate: UserPlanUpdate): Promise<User> {
    const response = await api.put<UserResponse>('/user/plan', planUpdate);
    return response.data.user;
  }

  async getAvailablePlans(): Promise<Plan[]> {
    const response = await api.get<PlansResponse>('/user/plans');
    return response.data.plans;
  }
}

export default new UserService(); 