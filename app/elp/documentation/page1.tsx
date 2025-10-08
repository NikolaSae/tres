// /app/help/documentation/page.tsx
import { getMarkdown } from "@/lib/docs";
import { MarkdownViewer } from "@/components/MarkdownViewer";

export default function DocumentationPage() {
  const appMarkdown = getMarkdown("PROJECT_STRUCTURE.md");
  const apiMarkdown = getMarkdown("PROJECT_API_STRUCTURE.md");

  return (
    <div className="p-6">
      <h1>Documentation</h1>
      <h2>APP Structure</h2>
      <MarkdownViewer content={appMarkdown} />
      <h2>API Structure</h2>
      <MarkdownViewer content={apiMarkdown} />
    </div>
  );
}
