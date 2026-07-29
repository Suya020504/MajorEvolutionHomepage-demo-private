"use client";

/**
 * 브라우저에서 PDF 텍스트를 뽑아냅니다.
 *
 * 파일은 서버로 보내지 않습니다. 학생 기기 안에서만 열고, 필요한 부분만
 * AI 요청에 실어 보냅니다. 텍스트가 없는 스캔 PDF는 만들어 내지 않고 실패로 알립니다.
 */

export type PdfPage = {
  page: number;
  text: string;
  /** 문장 단위로 나눈 것. 문장을 골라 근거로 남기기 위해 씁니다. */
  sentences: string[];
};

export type PdfDocument = {
  fileName: string;
  pageCount: number;
  pages: PdfPage[];
  /** 텍스트 레이어가 거의 없으면 스캔본으로 봅니다. */
  looksScanned: boolean;
};

export class PdfReadError extends Error {
  constructor(readonly code: "encrypted" | "scanned" | "parse-failed", message: string) {
    super(message);
  }
}

/** 한국어·영어 문장 끝을 기준으로 자릅니다. 약어 뒤 마침표는 완벽히 거르지 못합니다. */
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.?!。])\s+|(?<=[다요음])\.\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);
}

export async function extractPdfText(file: File): Promise<PdfDocument> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const buffer = await file.arrayBuffer();
  let doc;
  try {
    doc = await pdfjs.getDocument({ data: buffer }).promise;
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "PasswordException") {
      throw new PdfReadError("encrypted", "암호가 걸린 PDF는 열 수 없습니다. 암호를 푼 파일로 다시 올려 주세요.");
    }
    throw new PdfReadError("parse-failed", "PDF를 읽지 못했습니다. 파일이 손상되지 않았는지 확인해 주세요.");
  }

  const pages: PdfPage[] = [];
  for (let n = 1; n <= doc.numPages; n += 1) {
    const page = await doc.getPage(n);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    pages.push({ page: n, text, sentences: splitSentences(text) });
  }

  const totalChars = pages.reduce((sum, page) => sum + page.text.length, 0);
  const looksScanned = totalChars < doc.numPages * 40;
  if (looksScanned) {
    throw new PdfReadError(
      "scanned",
      "텍스트 레이어가 없는 스캔본으로 보입니다. 글자를 선택할 수 있는 PDF를 올리거나 OCR을 거친 파일을 사용해 주세요.",
    );
  }

  return { fileName: file.name, pageCount: doc.numPages, pages, looksScanned };
}
