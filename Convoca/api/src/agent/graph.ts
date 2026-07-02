import { StateGraph, END, START } from "@langchain/langgraph";
import { AgentState } from "./state.js";
import { findCandidates, createApplications, sendInitialContact } from "./nodes.js";

const screeningGraph = new StateGraph(AgentState)
  .addNode("findCandidates", findCandidates)
  .addNode("createApplications", createApplications)
  .addNode("sendInitialContact", sendInitialContact)
  .addEdge(START, "findCandidates")
  .addEdge("findCandidates", "createApplications")
  .addEdge("createApplications", "sendInitialContact")
  .addEdge("sendInitialContact", END)
  .compile();

export async function runScreeningAgent(
  tenantId: string,
  jobId: string,
  threshold = 0.5,
): Promise<void> {
  await screeningGraph.invoke({ tenantId, jobId, threshold, matches: [], applications: [] });
}
