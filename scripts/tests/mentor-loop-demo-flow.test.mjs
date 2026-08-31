import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test, { after } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "../..");
const runtimeDirectory = fs.mkdtempSync(path.join(testDirectory, ".mentor-loop-demo-runtime-"));
const helperSourcePath = path.join(repositoryRoot, "lib/mentor-loop-demo.ts");
const screenSource = fs.readFileSync(
  path.join(repositoryRoot, "components/screens/mentor-loop-screen.tsx"),
  "utf8",
);

const compiled = ts.transpileModule(fs.readFileSync(helperSourcePath, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  fileName: "lib/mentor-loop-demo.ts",
  reportDiagnostics: true,
});
const errors = (compiled.diagnostics ?? []).filter(
  (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
);
assert.equal(errors.length, 0, "시연 멘토 기록 도우미를 테스트용으로 변환하지 못했습니다.");
const outputPath = path.join(runtimeDirectory, "mentor-loop-demo.cjs");
fs.writeFileSync(outputPath, compiled.outputText, "utf8");
const demo = await import(pathToFileURL(outputPath).href);

after(() => fs.rmSync(runtimeDirectory, { recursive: true, force: true }));

const emptyEntry = {
  topicId: "topic-demo",
  professorId: "professor-demo",
  meetingDate: "2026-08-31",
  feedbackSummary: "",
  recommendedResources: "",
  cautionPoint: "",
  commitment: "",
  before: {
    question: "기존 연구질문",
    methodDetail: "기존 연구방법",
    scope: "기존 연구범위",
  },
  after: {
    question: "기존 연구질문",
    methodDetail: "기존 연구방법",
    scope: "기존 연구범위",
  },
  sevenDayActions: ["", "", ""],
  nextCheckAt: "",
  followUpEmail: "",
  updatedAt: "2026-08-31T00:00:00.000Z",
};

test("시연 기록은 받은 조언부터 7일 행동까지 채우되 기존 수정 전 원문을 보존한다", () => {
  const filled = demo.createMentorLoopDemoEntry(
    emptyEntry,
    new Date("2026-08-31T03:00:00.000Z"),
  );

  assert.notEqual(filled, emptyEntry);
  assert.deepEqual(filled.before, emptyEntry.before);
  assert.equal(emptyEntry.feedbackSummary, "");
  assert.match(filled.feedbackSummary, /거래자료와 사진 정보/);
  assert.match(filled.after.question, /가격 예측 오차/);
  assert.match(filled.after.methodDetail, /MAE/);
  assert.match(filled.after.scope, /농산물 2개 품목/);
  assert.equal(filled.sevenDayActions.filter(Boolean).length, 3);
  assert.equal(filled.nextCheckAt, "2026-09-07");
  assert.equal(filled.followUpEmail, "");
});

test("상단 시연 버튼은 화면 초안과 이메일만 만들고 자동 저장하지 않는다", () => {
  assert.match(screenSource, /topAction=\{\([\s\S]*mentor-loop-demo-fill/);
  assert.match(screenSource, /시연 기록 한 번에 채우기/);
  assert.match(screenSource, /createMentorLoopDemoEntry\(entry\)/);
  assert.match(screenSource, /followUpEmail: buildFollowUpEmail\(demoEntry, match, topic\)/);
  const handler = screenSource.slice(
    screenSource.indexOf("  const fillPresentationEntry = () =>"),
    screenSource.indexOf("  const copyEmail = async () =>"),
  );
  assert.doesNotMatch(handler, /saveEntry\(/);
  assert.match(handler, /setStage\(1\)/);
  assert.match(handler, /마지막 단계에서 저장하세요/);
  assert.match(screenSource, /lastSavedEntry \? "저장됨" : "저장 전"/);
});
