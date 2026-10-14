# HearMaxx Astro Workspace Rules & Conventions

## 1. UI & Visual Design Guardrails
- **Homepage Appointment Banner**:
  - `src/assets/home/google-reviews-banner.jpg` is a dark navy background (`#0a192f`) with healthcare doodle sketches.
  - Always render the overlay content: Eyebrow (`JUST MAKE AN APPOINTMENT & YOU'RE DONE!`), headline (`Need a hearing expert for a free ear check-up?` in serif typography), and the white rounded `Contact us` button with a solid phone icon.
- **Glass Headers**:
  - Do NOT place low-opacity background images (e.g. city skylines with `opacity-20`) behind glass headers on `/find-our-clinics/` or `/contact-us/`. Use clean, high-contrast `glass-strong` cards.
- **Clinic Storefronts**:
  - Never crop card graphics with text or buttons baked into the image pixels. Always use semantic markup, live buttons, and Google Maps embeds.
- **Specialist Avatar**:
  - Keep Sheeraz Rahim's circular headshot centered with bust/upper-body framing to avoid clipping.

## 2. Verification Protocol
- Run `npm run build` before pushing any changes to verify all 13 pages compile with 0 errors.
- Ensure all asset imports are actively referenced in template markup.
