import { Annotation } from "@langchain/langgraph";
import type { JobMatch } from "../modules/matching/matching.service.js";

export interface AgentApplication {
  applicationId: string;
  candidateId: string;
}

export const AgentState = Annotation.Root({
  tenantId: Annotation<string>,
  jobId: Annotation<string>,
  threshold: Annotation<number>,
  matches: Annotation<JobMatch[]>({ default: () => [], reducer: (_prev, next) => next }),
  applications: Annotation<AgentApplication[]>({
    default: () => [],
    reducer: (_prev, next) => next,
  }),
});

export type AgentStateType = typeof AgentState.State;
