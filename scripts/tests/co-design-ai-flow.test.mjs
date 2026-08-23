import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8");

test("공동설계는 공통 3문항 뒤 API 맞춤 질문 2문항으로 이어진다", async () => {
  const [data, screen, route] = await Promise.all([
    read("data/co-design.ts"),
    read("components/screens/co-design-screen.tsx"),
    read("app/api/ai/co-design/questions/route.ts"),
  ]);

  assert.match(data, /CO_DESIGN_BASE_QUESTION_COUNT = 3/);
  assert.match(data, /CO_DESIGN_TOTAL_QUESTION_COUNT = 5/);
  assert.match(data, /id: "adaptive-1"/);
  assert.match(data, /id: "adaptive-2"/);
  assert.match(screen, /requestCoDesignFollowUpQuestions/);
  assert.match(screen, /step === CO_DESIGN_BASE_QUESTION_COUNT - 1/);
  assert.match(screen, /setFollowUpQuestions\(response\.questions, "ai"\)/);
  assert.match(screen, /setFollowUpQuestions\(DEFAULT_FOLLOW_UP_QUESTIONS, "fallback"\)/);
  assert.match(route, /generateCoDesignFollowUpQuestions/);
});

test("후보 생성은 공통·맞춤 질문 ID 다섯 개를 모두 요구한다", async () => {
  const [data, server] = await Promise.all([
    read("data/co-design.ts"),
    read("lib/openai-server.ts"),
  ]);

  assert.match(data, /expectedCoDesignQuestionIds/);
  assert.match(server, /expectedQuestionIds = expectedCoDesignQuestionIds/);
  assert.match(server, /answers\.length !== expectedQuestionIds\.length/);
});

test("프로젝트 교수 연결만 공식 후보 안에서 AI 재정렬한다", async () => {
  const [route, server, data] = await Promise.all([
    read("app/api/professors/match/route.ts"),
    read("lib/openai-server.ts"),
    read("lib/professor-data.server.ts"),
  ]);

  assert.match(data, /getOfficialProfessorRoleCandidates/);
  assert.match(route, /!topic\.id\.startsWith\("discovery:"\)/);
  assert.match(route, /!topic\.id\.startsWith\("context:"\)/);
  assert.match(route, /rerankProfessorMentors\(topic, roleCandidates\)/);
  assert.match(server, /제공된 candidateKey만 고르세요/);
  assert.match(server, /new Set\(selected\.map\(\(match\) => match\.professor\.id\)\)\.size !== 3/);
});
