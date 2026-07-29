import { redirect } from "next/navigation";

export default function PaperPage() {
  redirect("/paper/reader?mode=bite");
}

