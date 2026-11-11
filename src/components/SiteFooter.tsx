import { site } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="on-umber bg-umber text-plaster">
      <div className="wrap flex flex-col gap-3 py-8 text-[length:var(--t-small)] sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <p>
          © {new Date().getFullYear()} {site.name}
        </p>
        <p className="text-plaster/80">Set in Anybody and Hanken Grotesk.</p>
        <a
          href="#top"
          className="link inline-flex min-h-11 items-center gap-1.5 font-semibold"
        >
          Back to top <span aria-hidden="true">↑</span>
        </a>
      </div>
    </footer>
  );
}
