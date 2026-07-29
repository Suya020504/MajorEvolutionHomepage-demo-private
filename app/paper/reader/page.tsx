import { PaperReaderShell } from "@/components/paper-reader/paper-reader-shell";

export default async function PaperReaderPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string }>;
}) {
  const { source } = await searchParams;
  return <PaperReaderShell openFavoritePickerOnLoad={source === "favorites"} />;
}
