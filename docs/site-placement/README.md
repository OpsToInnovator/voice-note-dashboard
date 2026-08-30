# Commercial placement

Drop-in for the ApexForm Life homepage ([apexformlife.com](https://apexformlife.com)). This is **not** a third paid product card. AFOS™ and Paradigm stay what people buy. Lens is the inspectable plant.

The commercial repo (`OpsToInnovator/apexform-life`) is not in this environment. Apply the strip there after that clone succeeds.

## Insert

1. Copy [noticing-lens-section.html](noticing-lens-section.html) into the homepage **immediately after** `<section id="paradigm">` … `</section>` (“Two products. One discipline”).
2. Copy [noticing-lens-decide.png](noticing-lens-decide.png) to `assets/noticing-lens-decide.png` on that site.
3. Set the **Run `$1M`** href to the public demo origin + `/#/think`.
   - Until Railway `noticing-lens-demo` has a domain: leave the placeholder `https://lens.apexformlife.com/#/think` and swap it for `https://<demo>.up.railway.app/#/think`.
   - Optional later: CNAME `lens.apexformlife.com` → that demo service.
4. Do **not** add a nav item. The live header is a multi-page IA (`/paradigm`, `/afos`, `/begin`), not homepage hash-sections. Do not invent a marketing IA.
5. Do not add this section to the sitemap unless that sitemap already lists homepage hashes (it does not).

Classes match the live site: `wrap`, `sec-head`, `eyebrow`, `split`, `hero-cta`, `btn btn-primary`, `btn btn-ghost`.

Do not call Lens free AFOS. Do not add Product Hunt language.

## GitHub About

Same paste as the root README. API write is 403 from this token.

- **Description:** `Noticing Lens — open thought operating system from ApexForm Life. Every thought gets a destination.`
- **Website:** public Think URL if live, else `https://apexformlife.com`
- **Topics:** `noticing-lens`, `apexform-life`, `thought-operating-system`, `afos`, `paradigm`, `apache-2.0`
