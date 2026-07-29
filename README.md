# 너의 교수님은?

전공과 진로의 갈림길에서, 교수님을 **찾고 · 만들고 · 잇는** 모바일 우선 프로토타입입니다. 공식 근거로 관련 교수를 찾고(찾다), 전공을 확장한 아이디어를 만들고(만들다), 첫 대화부터 다음 만남까지 이어줍니다(잇다).

기준 문서는 `너의_교수님은_핵심3기능_기능명세_V2_2026-07-29`이며, 브랜드 자산은 V3 패키지에서 `public/brand/nyp-v03/`로 옮겨 `lib/brand-assets.ts`에서 경로를 관리합니다.

## 실행

```bash
npm install
```

루트에 `.env.local`을 만들고 서버 전용 키를 설정합니다.

```bash
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5-mini
```

```bash
npm run dev
```

기본 개발 주소는 `http://localhost:3000`입니다.

## 핵심 3기능 MVP

`http://localhost:3000/`에서 `찾다 · 만들다 · 잇다` 세 기능을 같은 무게로 확인할 수 있습니다.

1. 자유 브레인스토밍, 학과 × AI 트렌드, 전공 융합 중 하나를 선택
2. AI가 한 번에 한 질문을 제시하고 사용자가 확인한 맥락을 누적
3. 숫자 점수 없이 연구질문·데이터·방법·범위·확인할 점을 같은 스키마로 비교
4. 후보 2개 중 하나를 선택하면 공식 근거 규칙으로 교수 1명과 다른 관점의 대안 1명 연결
5. `/professors/[id]`에서 공식 연구분야·논문 상태·근거 ID 확인
6. `/quest`에서 논문 한입, 첫마디 랜덤박스, 침묵 구조대, 메일 초안, 다음 만남 씨앗 사용
7. `/paper/reader?mode=bite`에서 논문 텍스트를 문제·방법·결과·한계·질문 카드로 정리
8. `/mentor-loop`에서 면담 피드백, 연구안 수정 전후, 7일 행동과 감사·후속 이메일을 저장

공식 프로필에 연구분야나 논문 목록이 없으면 추정해서 채우지 않습니다. `공식 프로필 미기재`, `프로필 접근 불가`, `파싱 실패`, `robots 차단`을 별도 상태로 기록합니다. DOI/KCI는 공식 프로필에 이미 노출된 논문의 서지 메타데이터 보강에만 사용합니다.

현재 런타임 데이터는 단국대 공식 디렉터리 115개 학과·전공을 시도한 정규화 결과 1,051명입니다. 학과 소속 결과가 공식 중앙 교원검색에도 없는 3개 전공은 `PARTIAL` 범위 공백으로 표시합니다. 교수 선택 과정에는 점수·순위 필드가 없습니다. 주제·방법·맥락의 공식 근거와 출처 완전성을 순서대로 확인하고, 같은 조건에서는 안정적인 교수 ID 순서로 결과를 재현합니다.

## 구형 주소 호환

초기 점수형 아이디어 랩, 전공 DNA, 구형 홈·탐색·보관함 화면 코드는 제거했습니다. 기존 북마크가 깨지지 않도록 주소 파일만 남겨 최신 화면으로 이동합니다.

- `/mentoring`, `/goal`, `/dna`, `/analyzing`, `/home` → `/`
- `/explore`, `/ideas`, `/ideas/compare`, `/evolution-report`, `/feasibility`, `/passport` → `/research`
- `/saved`, `/profile` → `/portfolio`
- `/paper` → `/paper/reader?mode=bite`

논문 한입 MVP는 사용자가 붙여 넣은 80~12,000자의 텍스트만 분석합니다. PDF 원문, 전체 번역, 근거 기반 자유 질의응답, 그림·표 해설은 팀원 모듈을 나중에 같은 경로로 연결할 후속 범위입니다.

## 기술 구성

- Next.js 15 App Router
- React 19, TypeScript
- Zustand persist 기반 브라우저 로컬 상태
- OpenAI Responses API와 strict JSON Schema 기반 맞춤 결과 생성
- Tailwind CSS 4와 전용 CSS 디자인 시스템
- Lucide 아이콘

분석 시 입력 프로필은 앱의 서버 API를 거쳐 OpenAI Responses API로 전송됩니다. API 키는 서버에서만 읽으며 클라이언트 번들에 포함하지 않습니다. 생성 결과, 선택 주제, 공식 교수 연결 결과, Knock Kit와 Mentor Loop 수정 내용은 브라우저 `localStorage`에 저장됩니다.

공동설계 AI 호출에 실패하면 준비된 샘플 결과로 흐름을 이어가며, 화면에서 샘플 결과임을 표시합니다. 논문 한입은 오류를 그대로 안내하고 결과를 임의로 생성하지 않습니다. AI가 생성한 탐색 방향은 외부 출처 검증을 마친 최신 동향으로 표시하지 않습니다.

화면 검증용 가상 교수 데이터는 제거했습니다. 공식 데이터 수집 결과는 출처·수집일·공식 프로필 미기재·robots 차단 상태와 함께 관리합니다. 회원 로그인, 여러 기기 동기화, 이메일 자동 발송은 후속 연동 범위입니다.

## 에셋과 문서

- 런타임 이미지: `public/major-evolution-assets`
- ZIP 원본 참고 자료: `design/reference-assets`
- 최신 제품 기획 기준: `docs/PRODUCT_PLAN_2026-07-28.md`
- 초기 제품 요구사항 보관본: `PRD.md`
- 멘토링 반영 MVP 제작 명세: `docs/MVP_SPEC.md`
- 교수 데이터 수집 명세와 실행 보고: `docs/PROFESSOR_DATA.md`
- 공식 교수 런타임 연결 구조와 제한: `docs/PROFESSOR_RUNTIME.md`
- 전체 서비스 흐름도와 유저플로우: `docs/SERVICE_FLOW.md`
- 논문 리더 팀원 인계 명세: `docs/PAPER_READER_HANDOFF.md`
- Core V2 리팩터링 변경·검증·위험 인계서: `docs/CORE_V2_REFACTOR_HANDOFF_2026-07-29.md`

## 검증

```bash
npm run typecheck
npm run professors:test
npm run professors:smoke
npm run build
npm audit --omit=dev
```

이번 Core V2 변경은 기본 데스크톱 화면과 390×844 모바일에서 홈·퀘스트·논문 한입을 실제 브라우저로 확인했습니다. 360px·430px·1440px 전체 라우트 회귀와 자동 E2E는 PR 전 최종 점검 범위입니다.
