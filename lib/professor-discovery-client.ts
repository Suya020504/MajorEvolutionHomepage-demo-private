import type { ResearchTopic } from "@/data/research-mvp";
import {
  discoveryContextToMatchTopic,
  type ProfessorDiscoveryContext,
} from "@/lib/professor-discovery-model";
import type {
  ProfessorMatchResponse,
} from "@/lib/professor-domain";
import {
  postProfessorMatch,
  type ProfessorMatchHttpOptions,
} from "@/lib/professor-match-http";

export type { ProfessorDiscoveryContext } from "@/lib/professor-discovery-model";
export { discoveryContextToMatchTopic } from "@/lib/professor-discovery-model";

export type ProfessorDiscoveryOptions = ProfessorMatchHttpOptions & {
  savedTopic?: ResearchTopic | null;
};

export function isDankookUniversity(value: string): boolean {
  const normalized = value.toLocaleLowerCase("ko-KR").replace(/\s+/g, "");
  return new Set([
    "단국대",
    "단국대학교",
    "dankook",
    "dankookuniversity",
  ]).has(normalized);
}

export async function requestProfessorDiscoveryMatches(
  context: ProfessorDiscoveryContext,
  options: ProfessorDiscoveryOptions = {},
): Promise<ProfessorMatchResponse> {
  const topic = discoveryContextToMatchTopic(context, options.savedTopic);
  return postProfessorMatch(topic, context.university, options);
}
