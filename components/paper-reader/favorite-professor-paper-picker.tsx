"use client";

import Link from "next/link";
import {
  BookOpenCheck,
  CircleAlert,
  ExternalLink,
  LoaderCircle,
  Search,
  Star,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  FavoriteProfessorPaperCatalog,
  ProfessorPaperSelection,
} from "@/lib/professor-domain";
import { requestFavoriteProfessorPaperCatalog } from "@/lib/professor-paper-client";
import {
  availablePublicationYears,
  createProfessorPaperSelection,
  filterAndSortPublications,
} from "@/lib/professor-paper-selection";

type FavoriteProfessorPaperPickerProps = {
  open: boolean;
  favoriteProfessorIds: string[];
  initialProfessorId?: string | null;
  onClose: () => void;
  onManualEntry: () => void;
  onRemoveMissing: (professorIds: string[]) => void;
  onSelect: (selection: ProfessorPaperSelection) => void;
};

export function FavoriteProfessorPaperPicker({
  open,
  favoriteProfessorIds,
  initialProfessorId,
  onClose,
  onManualEntry,
  onRemoveMissing,
  onSelect,
}: FavoriteProfessorPaperPickerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [professors, setProfessors] = useState<FavoriteProfessorPaperCatalog[]>([]);
  const [missingProfessorIds, setMissingProfessorIds] = useState<string[]>([]);
  const [selectedProfessorId, setSelectedProfessorId] = useState("");
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const favoriteKey = favoriteProfessorIds.join("|");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open || favoriteProfessorIds.length === 0) {
      setProfessors([]);
      setMissingProfessorIds([]);
      setSelectedProfessorId("");
      setError("");
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError("");
    void requestFavoriteProfessorPaperCatalog(favoriteProfessorIds, {
      signal: controller.signal,
    })
      .then((response) => {
        setProfessors(response.professors);
        setMissingProfessorIds(response.missingProfessorIds);
        setSelectedProfessorId((current) => {
          const preferred = current || initialProfessorId || "";
          return response.professors.some((professor) => professor.id === preferred)
            ? preferred
            : response.professors[0]?.id ?? "";
        });
      })
      .catch((requestError) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "교수님 논문 목록을 불러오지 못했습니다.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [favoriteKey, favoriteProfessorIds, initialProfessorId, open, reloadKey]);

  const selectedProfessor = useMemo(
    () => professors.find((professor) => professor.id === selectedProfessorId) ?? null,
    [professors, selectedProfessorId],
  );
  const years = useMemo(
    () => availablePublicationYears(selectedProfessor?.publications ?? []),
    [selectedProfessor],
  );
  const visiblePublications = useMemo(
    () => filterAndSortPublications(selectedProfessor?.publications ?? [], { query, year }),
    [query, selectedProfessor, year],
  );

  const chooseProfessor = (professorId: string) => {
    setSelectedProfessorId(professorId);
    setQuery("");
    setYear("");
  };

  return (
    <dialog
      ref={dialogRef}
      className="favorite-paper-dialog"
      aria-labelledby="favorite-paper-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="favorite-paper-dialog__surface">
        <header className="favorite-paper-dialog__header">
          <div>
            <span><Star size={15} fill="currentColor" aria-hidden="true" /> 즐겨찾기에서 선택</span>
            <h2 id="favorite-paper-title">어떤 교수님의 논문을 준비할까요?</h2>
            <p>공식 프로필에서 수집한 최근 논문 최대 6건만 보여드려요.</p>
          </div>
          <button type="button" aria-label="논문 선택 창 닫기" onClick={onClose}>
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        {favoriteProfessorIds.length === 0 ? (
          <section className="favorite-paper-empty">
            <Star size={28} aria-hidden="true" />
            <h3>아직 즐겨찾는 교수님이 없어요</h3>
            <p>나의 교수님에서 관심 있는 교수님을 별표로 저장하면 공식 논문을 여기서 고를 수 있어요.</p>
            <div>
              <Link href="/professors" onClick={onClose}>교수님 찾으러 가기</Link>
              <button type="button" onClick={onManualEntry}>논문 직접 입력</button>
            </div>
          </section>
        ) : isLoading ? (
          <div className="favorite-paper-loading" role="status">
            <LoaderCircle className="spin" aria-hidden="true" />
            <p>즐겨찾는 교수님의 공식 논문을 불러오고 있어요.</p>
          </div>
        ) : error ? (
          <section className="favorite-paper-error" role="alert">
            <CircleAlert size={24} aria-hidden="true" />
            <h3>논문 목록을 불러오지 못했어요</h3>
            <p>{error}</p>
            <button type="button" onClick={() => setReloadKey((current) => current + 1)}>
              다시 시도
            </button>
          </section>
        ) : (
          <div className="favorite-paper-dialog__body">
            {missingProfessorIds.length > 0 && (
              <div className="favorite-paper-missing" role="status">
                <span>
                  현재 공식 데이터에서 찾지 못한 즐겨찾기 {missingProfessorIds.length}건은 제외했어요.
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveMissing(missingProfessorIds)}
                >
                  유효하지 않은 항목 정리
                </button>
              </div>
            )}

            {professors.length === 0 ? (
              <section className="favorite-paper-error" role="status">
                <CircleAlert size={24} aria-hidden="true" />
                <h3>공식 데이터에서 즐겨찾기를 다시 확인해 주세요</h3>
                <p>저장된 교수님 ID가 현재 공식 데이터에 없어 논문 목록을 만들지 못했어요.</p>
                <div>
                  <Link href="/professors" onClick={onClose}>교수님 다시 찾기</Link>
                  <button type="button" onClick={onManualEntry}>논문 직접 입력</button>
                </div>
              </section>
            ) : (
            <div className="favorite-paper-layout">
              <nav className="favorite-paper-professors" aria-label="즐겨찾는 교수님">
                {professors.map((professor) => (
                  <button
                    type="button"
                    key={professor.id}
                    className={selectedProfessorId === professor.id ? "is-selected" : ""}
                    aria-pressed={selectedProfessorId === professor.id}
                    onClick={() => chooseProfessor(professor.id)}
                  >
                    <span>{professor.name} {professor.title}</span>
                    <small>{professor.department}</small>
                    <em>수집 논문 {professor.publications.length}건</em>
                  </button>
                ))}
              </nav>

              {selectedProfessor && (
                <section className="favorite-paper-results" aria-live="polite">
                  <div className="favorite-paper-results__heading">
                    <div>
                      <h3>{selectedProfessor.name} 교수님의 논문</h3>
                      <p>{selectedProfessor.college} · {selectedProfessor.department}</p>
                    </div>
                    <a
                      href={selectedProfessor.officialProfileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      공식 프로필 <ExternalLink size={14} aria-hidden="true" />
                    </a>
                  </div>

                  {selectedProfessor.publications.length > 0 ? (
                    <>
                      <div className="favorite-paper-filters">
                        <label>
                          <span className="sr-only">논문 제목 검색</span>
                          <Search size={16} aria-hidden="true" />
                          <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value.slice(0, 100))}
                            placeholder="논문 제목 검색"
                          />
                        </label>
                        <label>
                          <span className="sr-only">발행 연도 선택</span>
                          <select value={year} onChange={(event) => setYear(event.target.value)}>
                            <option value="">전체 연도</option>
                            {years.map((item) => <option key={item} value={item}>{item}년</option>)}
                          </select>
                        </label>
                      </div>

                      <p className="favorite-paper-count">
                        최신순 {visiblePublications.length}건
                      </p>
                      {visiblePublications.length > 0 ? (
                        <div className="favorite-paper-list">
                          {visiblePublications.map((publication) => (
                            <article key={publication.id}>
                              <BookOpenCheck size={18} aria-hidden="true" />
                              <div>
                                <h4>{publication.title}</h4>
                                <p>
                                  {publication.publicationType}
                                  {" · "}
                                  {publication.publishedDate ?? "발행일 미기재"}
                                </p>
                                {(publication.doi || publication.kciId) && (
                                  <small>
                                    {publication.doi && `DOI ${publication.doi}`}
                                    {publication.doi && publication.kciId && " · "}
                                    {publication.kciId && `KCI ${publication.kciId}`}
                                  </small>
                                )}
                                <div>
                                  <a
                                    href={publication.officialProfileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    공식 프로필에서 확인 <ExternalLink size={13} aria-hidden="true" />
                                  </a>
                                  <button
                                    type="button"
                                    aria-label={`${publication.title} 논문 선택`}
                                    onClick={() => onSelect(
                                      createProfessorPaperSelection(selectedProfessor, publication),
                                    )}
                                  >
                                    이 논문 선택
                                  </button>
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <div className="favorite-paper-no-result">
                          <CircleAlert size={20} aria-hidden="true" />
                          <p>검색 조건에 맞는 논문이 없어요. 제목이나 연도를 바꿔 보세요.</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="favorite-paper-no-result">
                      <CircleAlert size={20} aria-hidden="true" />
                      <div>
                        <h4>
                          {selectedProfessor.publicationsStatus === "NOT_LISTED_ON_OFFICIAL_PROFILE"
                            ? "공식 프로필에 논문 목록이 기재되지 않았어요"
                            : "공식 프로필 논문을 현재 불러올 수 없어요"}
                        </h4>
                        <p>
                          논문이 없다는 뜻은 아니에요. 공식 프로필을 직접 확인하거나,
                          직접 찾은 제목과 초록을 입력할 수 있습니다.
                        </p>
                        <button type="button" onClick={onManualEntry}>논문 직접 입력</button>
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>
            )}
          </div>
        )}
      </div>
    </dialog>
  );
}
