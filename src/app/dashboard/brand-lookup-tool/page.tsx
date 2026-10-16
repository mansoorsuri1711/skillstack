import { redirect } from "next/navigation";

/** Brand Lookup was replaced by AI Visibility → Prompt Research. */
export default function BrandLookupRedirectPage() {
  redirect("/dashboard/prompt-research-tool");
}
