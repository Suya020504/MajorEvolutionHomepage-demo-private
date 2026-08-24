import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

const screen = source("components/screens/ai-professor-screen.tsx");
const conversationMap = source("components/screens/ai-conversation-map.tsx");
const screenStyles = source("components/screens/ai-professor-screen.module.css");
const conversationMapModel = source("lib/ai-conversation-map.ts");
const store = source("store/ai-professor-store.ts");
const server = source("lib/openai-server.ts");
const route = source("app/api/ai/growth-professor/route.ts");
const portfolio = source("components/screens/portfolio-hub-screen.tsx");
const home = source("components/screens/unified-home-screen.tsx");
const homeMapPreview = source("components/screens/home-ai-map-preview.tsx");
const homeStyles = source("components/screens/home-dashboard.module.css");

test("성장과정에서 나의 AI 교수님 대화로 바로 이어진다", () => {
  assert.match(portfolio, /나의 AI 교수님/);
  assert.match(portfolio, /\/portfolio\/ai-professor/);
  assert.match(screen, /가볍게 이야기하기/);
  assert.match(screen, /실제 교수님 만남 준비/);
  assert.match(screen, /프로젝트로 구체화/);
});

test("AI는 실제 교수를 대신하지 않고 사용자가 고른 요약만 성장 메모로 저장한다", () => {
  assert.match(server, /실제 교수, 지도교수, 상담사, 학사 담당자가 아닙니다/);
  assert.match(server, /입력에 없는 성격, 적성, 성과/);
  assert.match(screen, /성장 메모로 남기기/);
  assert.match(store, /saveReflection/);
  assert.match(store, /sourceMessageId/);
  assert.match(store, /MAX_MESSAGES = 40/);
  assert.match(store, /MAX_NOTES = 20/);
});

test("OpenAI 키는 서버 경로에서만 사용하고 오류에도 학생 메시지를 보존한다", () => {
  assert.match(route, /generateGrowthProfessorReply/);
  assert.match(server, /process\.env\.OPENAI_API_KEY/);
  assert.doesNotMatch(screen, /OPENAI_API_KEY/);
  assert.match(screen, /addUserMessage\(content, branchOrigin\?\.parentId \?\? null\)/);
  assert.match(screen, /다시 보내기/);
});

test("긴 대화와 실제 원문에 근거한 대화 지도를 오갈 수 있다", () => {
  assert.match(screen, /대화하기/);
  assert.match(screen, /대화 지도/);
  assert.match(screen, /AiConversationMap/);
  assert.match(conversationMap, /생각 진화 지도/);
  assert.match(conversationMap, /이 카드가 나온 대화/);
  assert.match(conversationMap, /내 질문/);
  assert.match(conversationMap, /AI 교수님 답변/);
  assert.match(conversationMap, /nodeSourceFullText/);
  assert.match(conversationMap, /\{selectedNode\.assistantMessage\.content\}/);
  assert.doesNotMatch(conversationMap, /excerpt\(selectedNode\.assistantMessage\.content/);
  assert.match(conversationMapModel, /buildConversationMap/);
  assert.match(conversationMapModel, /userMessage/);
  assert.match(conversationMapModel, /assistantMessage/);
  assert.match(conversationMapModel, /mapSummary/);
  assert.match(conversationMapModel, /buildMapSummary/);
  assert.match(conversationMap, /\{node\.mapSummary\}/);
  assert.match(conversationMap, /생각 씨앗/);
  assert.match(conversationMap, /발견한 단서/);
  assert.match(conversationMap, /선택한 갈림길/);
  assert.match(conversationMap, /다음 발걸음/);
  assert.match(conversationMap, /대화가 깊어지면 새 질문은 옆 가지로 자라요/);
  assert.match(conversationMap, /data-branching=\{children\.length > 1/);
  assert.match(screenStyles, /\.mapNode\[data-branching="true"\]/);
});

test("홈에서 실제 AI 대화 지도 요약을 확인하고 전체 지도 탭으로 이어진다", () => {
  const progressIndex = home.indexOf("styles.progressSection");
  const previewIndex = home.indexOf("<HomeAiMapPreview />");
  const lowerGridIndex = home.indexOf("styles.lowerGrid");

  assert.match(home, /HomeAiMapPreview/);
  assert.ok(progressIndex < previewIndex && previewIndex < lowerGridIndex);
  assert.match(homeMapPreview, /buildConversationMap/);
  assert.match(homeMapPreview, /mapDecisions\[node\.id\] !== "exclude"/);
  assert.match(homeMapPreview, /대화로 정리된 나의 생각 지도/);
  assert.match(homeMapPreview, /\/portfolio\/ai-professor\?view=map/);
  assert.match(homeMapPreview, /아직 만들어진 대화 지도가 없어요/);
  assert.match(screen, /new URLSearchParams\(window\.location\.search\)\.get\("view"\)/);
  assert.match(homeStyles, /\.aiMapNode \{[\s\S]*?margin-inline: auto/);
});

test("사용자가 핵심 흐름을 남기거나 제외해도 원문 대화는 보존한다", () => {
  assert.match(conversationMap, /핵심으로 남기기/);
  assert.match(conversationMap, /지도에서 제외/);
  assert.match(conversationMap, /원문 대화는 삭제되지 않아요/);
  assert.match(conversationMap, /나의 성장과정에 반영하기/);
  assert.match(store, /mapDecisions/);
  assert.match(store, /setMapDecision/);
  assert.match(store, /clearMapDecision/);
  assert.match(store, /version: 3/);
  assert.match(store, /migrate:/);
});

test("과거 노드에서 새 갈래를 시작하고 트리에서 여러 자식 흐름을 확인한다", () => {
  assert.match(conversationMap, /이 생각에서 새 갈래 만들기/);
  assert.match(conversationMap, /ConversationTreeNode/);
  assert.match(conversationMap, /childIds/);
  assert.match(conversationMap, /onStartBranch/);
  assert.match(conversationMapModel, /branchParentMessageId/);
  assert.match(conversationMapModel, /childrenByParent/);
  assert.match(conversationMapModel, /getConversationMapRoots/);
  assert.match(screen, /새 갈래로 이어가기/);
  assert.match(screen, /branchOrigin/);
  assert.match(screen, /messages\.slice\(0, parentIndex \+ 1\)/);
  assert.match(store, /branchParentMessageId/);
});

test("태블릿과 모바일에서는 분기 지도를 잘림 없는 세로 트리로 재배치한다", () => {
  assert.match(screenStyles, /container-type: inline-size/);
  assert.match(screenStyles, /@container \(max-width: 760px\)/);
  assert.match(screenStyles, /@container \(min-width: 1000px\)/);
  assert.match(screenStyles, /\.mapTreeItem > ol > \.mapTreeItem::before/);
  assert.match(screenStyles, /\.mapTree \.mapNode \{[\s\S]*?width: 100%/);
  assert.match(screenStyles, /\.mapCanvas \{[\s\S]*?overflow-x: hidden/);
  assert.match(screenStyles, /\.mapOutcomeNode \{[\s\S]*?max-width: none/);
  assert.match(conversationMap, /mapOutcomeArrow/);
});
