import { site } from "@/content/site";

type NavItem = { label: string; href: string };

const NAV: NavItem[] = [
  { label: "Work", href: "#work" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

/** `home` is where the mark leads: the top of this page, or the front page. */
export function SiteHeader({
  home = "#top",
  nav = NAV,
}: {
  home?: string;
  nav?: NavItem[];
}) {
  return (
    <header className="on-persimmon absolute inset-x-0 top-0 z-20 bg-persimmon">
      <div className="wrap flex min-h-[76px] flex-wrap items-center justify-between gap-x-4 sm:min-h-[92px]">
        <a
          href={home}
          className="inline-flex min-h-11 items-center font-display text-[1.375rem] font-black tracking-[-0.02em] [font-variation-settings:'wdth'_150]"
          aria-label={`${site.name}, ${home === "#top" ? "back to top" : "front page"}`}
        >
          {site.monogram}
        </a>
        <nav aria-label="Primary">
          <ul className="-mr-2.5 flex flex-wrap items-center justify-end sm:mr-0 sm:gap-2">
            {nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-full border-2 border-transparent px-2.5 text-[length:var(--t-ui)] font-semibold transition-colors duration-150 hover:border-umber sm:px-4"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
