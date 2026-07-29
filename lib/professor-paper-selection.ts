import type {
  FavoriteProfessorPaperCatalog,
  OfficialPublication,
  ProfessorPaperSelection,
} from "@/lib/professor-domain";

export const MAX_FAVORITE_PROFESSORS = 30;

export function publicationYear(publication: OfficialPublication): string | null {
  const matched = publication.publishedDate?.match(/^(\d{4})/);
  return matched?.[1] ?? null;
}

function publicationTimestamp(publication: OfficialPublication): number {
  if (!publication.publishedDate) return Number.NEGATIVE_INFINITY;
  const timestamp = Date.parse(publication.publishedDate);
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
}

export function availablePublicationYears(
  publications: OfficialPublication[],
): string[] {
  return Array.from(
    new Set(publications.map(publicationYear).filter((year): year is string => Boolean(year))),
  ).sort((left, right) => right.localeCompare(left, "ko-KR"));
}

export function filterAndSortPublications(
  publications: OfficialPublication[],
  options: { query?: string; year?: string } = {},
): OfficialPublication[] {
  const normalizedQuery = options.query?.trim().toLocaleLowerCase("ko-KR") ?? "";
  const selectedYear = options.year?.trim() ?? "";

  return publications
    .filter((publication) => {
      if (selectedYear && publicationYear(publication) !== selectedYear) return false;
      if (!normalizedQuery) return true;
      return [
        publication.title,
        publication.publicationType,
        publication.doi,
        publication.kciId,
      ].some((value) => value?.toLocaleLowerCase("ko-KR").includes(normalizedQuery));
    })
    .sort((left, right) => {
      const dateDifference = publicationTimestamp(right) - publicationTimestamp(left);
      if (dateDifference !== 0) return dateDifference;
      return left.title.localeCompare(right.title, "ko-KR");
    });
}

export function createProfessorPaperSelection(
  professor: FavoriteProfessorPaperCatalog,
  publication: OfficialPublication,
): ProfessorPaperSelection {
  return {
    professorId: professor.id,
    professorName: professor.name,
    professorDepartment: professor.department,
    paperId: publication.id,
    title: publication.title,
    publicationType: publication.publicationType,
    publishedDate: publication.publishedDate,
    doi: publication.doi,
    kciId: publication.kciId,
    officialProfileUrl: publication.officialProfileUrl || professor.officialProfileUrl,
    selectedAt: new Date().toISOString(),
  };
}
