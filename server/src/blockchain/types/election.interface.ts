import { ElectionType } from "./election-type.enum";

export interface CreateElectionParams {
    userId: string;
    type: ElectionType;
    name: string;
    startImmediately?: boolean;
    voterLimit?: number;
    candidateNames: string[];
    maxChoicesPerVoter?: number;
    additionalParams?: Record<string, any>;
  }