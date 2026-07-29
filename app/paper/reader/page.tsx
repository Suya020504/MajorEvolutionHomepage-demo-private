import { PaperReader } from "@/components/paper-reader/paper-reader";
import { PaperReaderShell } from "@/components/paper-reader/paper-reader-shell";

export default async function PaperReaderPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; source?: string }>;
}) {
  const { mode, source } = await searchParams;
  if (mode === "bite" || source === "favorites") {
    return <PaperReaderShell openFavoritePickerOnLoad={source === "favorites"} />;
  }

  return <PaperReader />;
}
