import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test, { after } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "../..");
const runtimeDirectory = fs.mkdtempSync(path.join(testDirectory, ".project-meeting-demo-runtime-"));
const helperSourcePath = path.join(repositoryRoot, "lib/project-meeting-demo.ts");
const screenSource = fs.readFileSync(
  path.join(repositoryRoot, "components/screens/project-meeting-screen.tsx"),
  "utf8",
);
const styleSource = fs.readFileSync(
  path.join(repositoryRoot, "components/screens/project-execution-screen.module.css"),
  "utf8",
);

const compiled = ts.transpileModule(fs.readFileSync(helperSourcePath, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  fileName: "lib/project-meeting-demo.ts",
  reportDiagnostics: true,
});
const errors = (compiled.diagnostics ?? []).filter(
  (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
);
assert.equal(errors.length, 0, "시연 프로젝트 자문 도우미를 테스트용으로 변환하지 못했습니다.");
const outputPath = path.join(runtimeDirectory, "project-meeting-demo.cjs");
fs.writeFileSync(outputPath, compiled.outputText, "utf8");
const demo = await import(pathToFileURL(outputPath).href);

after(() => fs.rmSync(runtimeDirectory, { recursive: true, force: true }));

test("시연 프로젝트 자문은 목적·질문·자료·반영 기록을 한 번에 준비한다", () => {
  const patch = demo.createProjectMeetingDemoPatch();
  assert.match(patch.meetingGoal, /가격 예측 오차/);
  assert.equal(patch.questions.length, 3);
  assert.ok(patch.questions.every((question) => question.trim().length > 0));
  assert.equal(Object.values(patch.materials).filter(Boolean).length, 4);
  assert.match(patch.reflection, /소규모 검증/);
  assert.equal("topicId" in patch, false);
  assert.equal("professorId" in patch, false);
});

test("프로젝트 자문 시연 버튼은 기존 자동 저장 흐름을 사용하고 모바일에서는 아이콘만 남긴다", () => {
  assert.match(screenSource, /className=\{styles\.demoFillButton\}/);
  assert.match(screenSource, /시연 프로젝트 자문 한 번에 채우기/);
  assert.match(screenSource, /updateDraft\(createProjectMeetingDemoPatch\(\)\)/);
  assert.match(screenSource, /시연 자문 데이터를 채우고 이 브라우저에 저장했어요/);
  assert.match(styleSource, /\.pageHeader[\s\S]*justify-content: space-between/);
  assert.match(styleSource, /@media \(max-width: 700px\)[\s\S]*\.demoFillButton \{ width: 44px/);
  assert.match(styleSource, /\.demoFillButton > span[\s\S]*clip: rect/);
});
