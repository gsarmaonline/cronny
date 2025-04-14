import { Action } from '../../services/action.service';
import { Job, JobTemplate } from '../../services/job.service';
import { Condition } from './ConditionsManager';

export interface JobFormData {
  name: string;
  type: string;
  inputType: string;
  inputValue: string;
  actionId: number;
  jobTemplateId: number;
  isRootJob: boolean;
  condition: Condition;
  jobTimeoutInSecs: number;
}

export interface JobTemplateOption {
  id: number;
  name: string;
  type?: string;
  inputType?: string;
  inputValue?: string;
}

export interface ActionFormData {
  name: string;
  description: string;
  user_id: number;
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
}

export type { Action, Job, JobTemplate }; 