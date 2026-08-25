import { PaperReader } from "@/components/paper-reader/paper-reader";
import { PaperReaderShell } from "@/components/paper-reader/paper-reader-shell";

export default async function PaperReaderPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; source?: string; step?: string }>;
}) {
  const { mode, source, step } = await searchParams;
  if (mode === "pdf") return <PaperReader />;
  if (mode === "bite" || source === "favorites") {
    return (
      <PaperReaderShell
        startFromFavorites={source === "favorites"}
        initialStep={step === "card" ? "card" : source === "favorites" ? "select" : "card"}
      />
    );
  }

  return <PaperReader />;
}
