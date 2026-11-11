import { notFound } from "next/navigation";
import { LabShell } from "@/components/LabShell";
import { findLab, labMetadata, visibleLabs } from "@/lib/labs";

/**
 * HTML labs: files in public/lab-files/<slug>/, shown full-screen in a frame.
 * React labs have their own folder (src/app/labs/<slug>/), which wins over this.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return visibleLabs()
    .filter((lab) => lab.kind === "html")
    .map((lab) => ({ slug: lab.slug }));
}

export async function generateMetadata({ params }: PageProps<"/labs/[slug]">) {
  const { slug } = await params;
  return labMetadata(slug);
}

export default async function HtmlLab({ params }: PageProps<"/labs/[slug]">) {
  const { slug } = await params;
  const lab = findLab(slug);
  if (!lab || lab.kind !== "html") notFound();

  return (
    <LabShell slug={slug}>
      <iframe
        src={`/lab-files/${slug}/index.html`}
        title={lab.title}
        className="block min-h-0 w-full flex-1 border-0 bg-umber"
        allow="fullscreen; clipboard-write; camera; microphone; gamepad; xr-spatial-tracking"
      />
    </LabShell>
  );
}
