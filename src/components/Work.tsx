import type { CSSProperties } from "react";
import { site } from "@/content/site";
import { projectId, projectNumber } from "@/lib/site";
import { ProjectCard } from "./ProjectCard";
import { Stripe, StripeLayer } from "./Stripe";

export function Work() {
  return (
    <section
      id="work"
      aria-labelledby="work-title"
      className="relative bg-plaster"
      style={{ "--b3": "var(--color-persimmon)" } as CSSProperties}
    >
      <StripeLayer>
        <Stripe
          piece="rail-right-turn-left"
          corner="br"
          order="umber-out"
          paint="down-then-west"
        />
      </StripeLayer>

      <div className="wrap rail-right page-grid relative z-[2] pt-24 pb-28 sm:pt-32 lg:pt-40 lg:pb-36">
        <div className="lane">
          <h2 id="work-title" className="type-h2">
            Selected work
          </h2>

          <ol className="mt-14 grid gap-y-24 sm:mt-20 lg:grid-cols-subgrid lg:gap-y-32">
            {site.projects.map((project, i) => {
              const number = projectNumber(i);
              return (
                <ProjectCard
                  key={project.slug}
                  id={projectId(project.slug)}
                  index={i}
                  number={number}
                  image={project.image}
                  href={project.links[0]?.href}
                >
                  <article aria-labelledby={`${projectId(project.slug)}-title`}>
                    <h3
                      id={`${projectId(project.slug)}-title`}
                      className="type-h3 transition-colors duration-150 group-hover/project:text-brick group-focus-within/project:text-brick"
                    >
                      <span className="sr-only">Project {number}: </span>
                      {project.title}
                    </h3>
                    <p className="prose-body mt-4">{project.summary}</p>

                    <dl className="mt-7 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 border-t-2 border-umber pt-5 text-[length:var(--t-small)]">
                      <dt className="font-medium text-ink-2">Role</dt>
                      <dd>{project.role}</dd>
                      {project.year && (
                        <>
                          <dt className="font-medium text-ink-2">Year</dt>
                          <dd className="tabular-nums">{project.year}</dd>
                        </>
                      )}
                      {project.tools.length > 0 && (
                        <>
                          <dt className="font-medium text-ink-2">Tools</dt>
                          <dd>{project.tools.join(", ")}</dd>
                        </>
                      )}
                    </dl>

                    {project.links.length > 0 && (
                      <ul className="mt-6 flex flex-wrap gap-x-7 gap-y-2">
                        {project.links.map((link) => (
                          <li key={link.label}>
                            <a
                              href={link.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="link inline-flex min-h-11 items-center gap-1.5 font-bold"
                            >
                              {link.label}
                              <span aria-hidden="true">↗</span>
                              <span className="sr-only">
                                {" "}
                                for {project.title} (opens in a new tab)
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                </ProjectCard>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
