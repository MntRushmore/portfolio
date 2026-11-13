import type { Metadata } from "next";
import { labsSite } from "@/content/labs";
import { site } from "@/content/site";
import { labsUrl } from "@/lib/labs";

export const metadata: Metadata = {
  metadataBase: labsUrl(),
  title: {
    // absolute: skips the root layout's "%s · Rushil Chopra" template.
    absolute: `${labsSite.title} · ${site.name}`,
    template: `%s · ${labsSite.title} · ${site.name}`,
  },
  description: labsSite.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: `${site.name} · ${labsSite.title}`,
    title: `${labsSite.title} · ${site.name}`,
    description: labsSite.description,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${labsSite.title} · ${site.name}`,
    description: labsSite.description,
  },
};

export default function LabsLayout({ children }: LayoutProps<"/labs">) {
  return children;
}
