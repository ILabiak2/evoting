import { ElectionType } from "./election-type.enum";

export interface CreateElectionParams {
    userId: string;
    type: ElectionType;
    name: string;
    startImmediately?: boolean;
    voterLimit?: number;
    candidateNames: string[];
    additionalParams?: Record<string, any>;
  }