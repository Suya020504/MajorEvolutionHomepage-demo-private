import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "../..");
const runtimeDirectory = fs.mkdtempSync(path.join(testDirectory, ".favorite-paper-runtime-"));

function compileCommonJs(sourceRelativePath, outputName) {
  const source = fs.readFileSync(path.join(repositoryRoot, sourceRelativePath), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: sourceRelativePath,
    reportDiagnostics: true,
  });
  const errors = (compiled.diagnostics ?? []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  assert.equal(errors.length, 0, `테스트용 변환 실패: ${sourceRelativePath}`);
  const outputPath = path.join(runtimeDirectory, outputName);
  fs.writeFileSync(outputPath, compiled.outputText, "utf8");
  return outputPath;
}

const memory = new Map();
globalThis.localStorage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, value),
  removeItem: (key) => memory.delete(key),
  clear: () => memory.clear(),
  key: (index) => Array.from(memory.keys())[index] ?? null,
  get length() {
    return memory.size;
  },
};

const selectionModule = require(
  compileCommonJs("lib/professor-paper-selection.ts", "professor-paper-selection.cjs"),
);
const questStoreModule = require(
  compileCommonJs("store/quest-store.ts", "quest-store.cjs"),
);

after(() => fs.rmSync(runtimeDirectory, { recursive: true, force: true }));

const publications = [
  {
    id: "paper-old",
    title: "교육 데이터 분석",
    publicationType: "일반논문",
    publishedDate: "2022-05-10",
    doi: null,
    kciId: null,
    officialProfileUrl: "https://example.edu/professor",
  },
  {
    id: "paper-new",
    title: "AI 기반 진로 멘토링",
    publicationType: "일반논문",
    publishedDate: "2025-03-01",
    doi: "10.0000/example",
    kciId: null,
    officialProfileUrl: "https://example.edu/professor",
  },
  {
    id: "paper-undated",
    title: "전공 탐색 연구",
    publicationType: "학술발표",
    publishedDate: null,
    doi: null,
    kciId: null,
    officialProfileUrl: "https://example.edu/professor",
  },
];

test("공식 논문을 최신순으로 정렬하고 제목·연도로 필터링한다", () => {
  const sorted = selectionModule.filterAndSortPublications(publications);
  assert.deepEqual(sorted.map((paper) => paper.id), [
    "paper-new",
    "paper-old",
    "paper-undated",
  ]);
  assert.deepEqual(
    selectionModule.filterAndSortPublications(publications, { query: "진로" })
      .map((paper) => paper.id),
    ["paper-new"],
  );
  assert.deepEqual(
    selectionModule.filterAndSortPublications(publications, { year: "2022" })
      .map((paper) => paper.id),
    ["paper-old"],
  );
  assert.deepEqual(
    selectionModule.availablePublicationYears(publications),
    ["2025", "2022"],
  );
});

test("선택 메타데이터는 교수와 논문의 공식 ID를 함께 보존한다", () => {
  const professor = {
    id: "professor-1",
    university: "단국대학교",
    college: "사회과학대학",
    department: "상담학과",
    name: "김교수",
    title: "교수",
    publications,
    publicationCount: publications.length,
    publicationsStatus: "FOUND",
    officialProfileUrl: "https://example.edu/professor",
  };
  const selection = selectionModule.createProfessorPaperSelection(
    professor,
    publications[1],
  );
  assert.equal(selection.professorId, "professor-1");
  assert.equal(selection.paperId, "paper-new");
  assert.equal(selection.title, "AI 기반 진로 멘토링");
  assert.equal(selection.officialProfileUrl, "https://example.edu/professor");
});

test("같은 논문 묶음은 5장을 갱신하고 다른 논문은 별도 묶음으로 저장한다", async () => {
  memory.clear();
  const { migrateQuestState, useQuestStore } = questStoreModule;
  const migrated = migrateQuestState({
    cards: [{
      id: "legacy",
      tool: "paper-bite",
      title: "기존 카드",
      body: "기존 내용",
      evidence: null,
      professorId: null,
      topicId: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    }],
  });
  assert.equal(migrated.cards?.[0]?.body, "기존 내용");
  assert.equal(migrated.cards?.[0]?.paperId, null);
  assert.equal(migrated.cards?.[0]?.bundleId, null);
  assert.equal(migrated.cards?.[0]?.slot, null);

  useQuestStore.setState({ cards: [], hasHydrated: true });
  const slots = ["problem", "method", "result", "limitations", "questions"];

  const saveBundle = (paperId, suffix) => {
    useQuestStore.getState().savePaperBundle({
      bundleId: `paper:professor-1:${paperId}`,
      evidence: {
        label: "사용자가 붙여 넣은 텍스트",
        page: null,
        href: "https://example.edu/professor",
      },
      professorId: "professor-1",
      topicId: null,
      paperId,
      cards: slots.map((slot) => ({
        slot,
        title: `${slot}-${suffix}`,
        body: `body-${suffix}`,
      })),
    });
  };

  saveBundle("paper-1", "first");
  const firstIds = useQuestStore.getState().cards.map((card) => card.id).sort();
  saveBundle("paper-1", "updated");
  const updatedCards = useQuestStore.getState().cards;
  assert.equal(updatedCards.length, 5);
  assert.deepEqual(updatedCards.map((card) => card.id).sort(), firstIds);
  assert.ok(updatedCards.every((card) => card.body === "body-updated"));

  saveBundle("paper-2", "second");
  assert.equal(useQuestStore.getState().cards.length, 10);
});

test("저장 공간 오류가 나도 3분 카드 묶음은 부분 저장되지 않는다", () => {
  const { useQuestStore } = questStoreModule;
  useQuestStore.setState({ cards: [], hasHydrated: true });
  const originalSetItem = globalThis.localStorage.setItem;
  globalThis.localStorage.setItem = () => {
    throw new DOMException("저장 공간 부족", "QuotaExceededError");
  };

  let threw = false;
  try {
    useQuestStore.getState().savePaperBundle({
      bundleId: "paper:professor-1:quota-paper",
      evidence: { label: "테스트", page: null, href: null },
      professorId: "professor-1",
      topicId: null,
      paperId: "quota-paper",
      cards: ["problem", "method", "result", "limitations", "questions"].map((slot) => ({
        slot,
        title: slot,
        body: slot,
      })),
    });
  } catch {
    threw = true;
  } finally {
    globalThis.localStorage.setItem = originalSetItem;
  }

  assert.equal(threw, true);
  assert.equal(useQuestStore.getState().cards.length, 5);
  useQuestStore.setState({ cards: [] });
});

test("논문 읽기는 선택, 3분 카드, PDF 해설의 세 단계로 분리된다", () => {
  const route = fs.readFileSync(
    path.join(repositoryRoot, "app/paper/reader/page.tsx"),
    "utf8",
  );
  const shell = fs.readFileSync(
    path.join(repositoryRoot, "components/paper-reader/paper-reader-shell.tsx"),
    "utf8",
  );
  const reader = fs.readFileSync(
    path.join(repositoryRoot, "components/paper-reader/paper-reader.tsx"),
    "utf8",
  );
  const steps = fs.readFileSync(
    path.join(repositoryRoot, "components/paper-reader/paper-reading-steps.tsx"),
    "utf8",
  );
  const styles = fs.readFileSync(
    path.join(repositoryRoot, "app/globals.css"),
    "utf8",
  );

  assert.match(route, /mode === "pdf"/);
  assert.match(route, /initialStep=\{step === "card" \? "card"/);
  assert.match(shell, /type PaperBiteWorkflowStep = "select" \| "card"/);
  assert.match(shell, /읽을 논문 한 편을 고르세요/);
  assert.match(shell, /논문 1개 선택하기/);
  assert.match(shell, /초록이나 본문을 3분 카드로 정리해요/);
  assert.match(shell, /3분 카드 만들기/);
  assert.match(shell, /PDF 넣고 페이지별 해설·요약하기/);
  assert.match(shell, /ready=\{isSaved\}/);
  assert.doesNotMatch(shell, /PDF 6탭 리더로 더 깊게 읽기/);
  assert.doesNotMatch(shell, /paper-reader-capabilities/);
  assert.match(reader, /PDF 넣고 페이지별 해설·요약 시작/);
  assert.match(reader, /paperId: selectedProfessorPaper\?\.paperId \?\? null/);
  assert.match(steps, /label: "논문 선택"[\s\S]*label: "3분 카드"[\s\S]*label: "PDF 해설"/);
  assert.match(styles, /\.paper-reading-steps ol[\s\S]*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(styles, /@media \(max-width: 420px\)[\s\S]*\.paper-reading-steps li/);
  assert.match(styles, /\.paper-bite-pdf-next[\s\S]*grid-template-columns/);
});
