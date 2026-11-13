import { site } from "@/content/site";
import { siteUrl } from "@/lib/site";

/**
 * The front page's JSON-LD: a ProfilePage about one Person, on a WebSite, with
 * the organizations the page names. Every relationship here is one the visible
 * page states (a project's role, a fact in About); nothing is added beyond it.
 */
export function profileJsonLd() {
  const home = siteUrl().toString();
  const ids = {
    website: `${home}#website`,
    page: `${home}#profilepage`,
    person: `${home}#person`,
    org: (slug: string) => `${home}#org-${slug}`,
    school: `${home}#org-school`,
    staffAt: `${home}#org-staff`,
    grantFrom: `${home}#org-grant`,
  };
  const { seo } = site;

  const projects = site.projects.filter((p) => p.website && /founder/i.test(p.role));

  // Every organization founded: the founder projects, then any not launched yet.
  const founded = [
    ...projects.map((p) => ({ slug: p.slug, name: p.title, url: p.website, description: p.summary, role: p.role })),
    ...seo.comingSoon.map((o) => ({ ...o, description: undefined, role: "Founder" })),
  ];

  const organizations = founded.map((o) => {
    const details = seo.orgDetails[o.slug] ?? {};
    return {
      "@type": "Organization",
      "@id": ids.org(o.slug),
      name: o.name,
      ...(details.legalName && { legalName: details.legalName }),
      url: o.url,
      ...(o.description && { description: o.description }),
      founder: [
        { "@id": ids.person },
        ...(seo.coFounders[o.slug] ?? []).map((name) => ({ "@type": "Person", name })),
      ],
      ...(details.parentOrganization && {
        parentOrganization: { "@id": ids.org(details.parentOrganization) },
      }),
    };
  });

  const person = {
    "@type": "Person",
    "@id": ids.person,
    name: site.name,
    url: home,
    ...(site.portrait && {
      image: {
        "@type": "ImageObject",
        url: new URL(site.portrait.src, home).toString(),
        caption: site.portrait.alt,
      },
    }),
    description: site.description,
    jobTitle: "Founder",
    email: `mailto:${site.contact.email}`,
    // Roles exactly as the Work section and About facts state them.
    memberOf: [
      ...founded.map((o) => ({
        "@type": "OrganizationRole",
        roleName: o.role,
        memberOf: { "@id": ids.org(o.slug) },
      })),
      {
        "@type": "OrganizationRole",
        roleName: "Staff",
        memberOf: { "@type": "Organization", "@id": ids.staffAt, ...seo.staffAt },
      },
    ],
    affiliation: { "@type": "EducationalOrganization", "@id": ids.school, ...seo.school },
    funding: {
      "@type": "Grant",
      name: `${seo.grantFrom.name} grant`,
      funder: { "@type": "Organization", "@id": ids.grantFrom, ...seo.grantFrom },
    },
    sameAs: [...site.contact.socials.map((s) => s.href), ...seo.profilesElsewhere],
  };

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": ids.website,
        url: home,
        name: site.name,
        description: site.description,
        inLanguage: "en",
        publisher: { "@id": ids.person },
      },
      {
        "@type": "ProfilePage",
        "@id": ids.page,
        url: home,
        name: site.title,
        description: site.description,
        inLanguage: "en",
        isPartOf: { "@id": ids.website },
        mainEntity: { "@id": ids.person },
      },
      person,
      ...organizations,
    ],
  };
}

/** JSON for a <script> tag: "<" escaped so content can't close the tag. */
export const jsonLdScript = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
