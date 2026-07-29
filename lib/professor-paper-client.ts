import type {
  FavoriteProfessorPaperCatalog,
  FavoriteProfessorPaperCatalogResponse,
  OfficialPublication,
} from "@/lib/professor-domain";

const FAVORITE_PAPER_TIMEOUT_MS = 15_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isOfficialPublication(value: unknown): value is OfficialPublication {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string"
    && typeof value.title === "string"
    && typeof value.publicationType === "string"
    && isNullableString(value.publishedDate)
    && isNullableString(value.doi)
    && isNullableString(value.kciId)
    && typeof value.officialProfileUrl === "string"
  );
}

function isFavoriteProfessorCatalog(
  value: unknown,
): value is FavoriteProfessorPaperCatalog {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string"
    && typeof value.university === "string"
    && typeof value.college === "string"
    && typeof value.department === "string"
    && typeof value.name === "string"
    && typeof value.title === "string"
    && Array.isArray(value.publications)
    && value.publications.every(isOfficialPublication)
    && typeof value.publicationCount === "number"
    && [
      "FOUND",
      "NOT_LISTED_ON_OFFICIAL_PROFILE",
      "PROFILE_UNAVAILABLE",
      "PARSE_FAILED",
      "ROBOTS_BLOCKED",
    ].includes(String(value.publicationsStatus))
    && typeof value.officialProfileUrl === "string"
  );
}

function isCatalogResponse(value: unknown): value is FavoriteProfessorPaperCatalogResponse {
  if (!isRecord(value)) return false;
  return (
    Array.isArray(value.professors)
    && value.professors.every(isFavoriteProfessorCatalog)
    && Array.isArray(value.missingProfessorIds)
    && value.missingProfessorIds.every((item) => typeof item === "string")
    && typeof value.fetchedAt === "string"
  );
}

export async function requestFavoriteProfessorPaperCatalog(
  professorIds: string[],
  options: { signal?: AbortSignal } = {},
): Promise<FavoriteProfessorPaperCatalogResponse> {
  if (options.signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const controller = new AbortController();
  let timedOut = false;
  const abortFromCaller = () => controller.abort();
  options.signal?.addEventListener("abort", abortFromCaller, { once: true });
  const timeoutId = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, FAVORITE_PAPER_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch("/api/professors/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ professorIds }),
      signal: controller.signal,
    });
  } catch (error) {
    if (timedOut) {
      throw new Error("교수님 논문 목록을 15초 안에 불러오지 못했습니다. 다시 시도해 주세요.");
    }
    if (options.signal?.aborted || controller.signal.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    throw error instanceof Error
      ? error
      : new Error("교수님 논문 목록 서버에 접속하지 못했습니다.");
  } finally {
    window.clearTimeout(timeoutId);
    options.signal?.removeEventListener("abort", abortFromCaller);
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error(`교수님 논문 목록 응답을 확인하지 못했습니다. (${response.status})`);
  }
  if (!response.ok) {
    const message = isRecord(data) && typeof data.error === "string"
      ? data.error
      : "교수님 논문 목록을 불러오지 못했습니다.";
    throw new Error(message);
  }
  if (!isCatalogResponse(data)) {
    throw new Error("교수님 논문 목록 응답 구성이 올바르지 않습니다.");
  }
  return data;
}
