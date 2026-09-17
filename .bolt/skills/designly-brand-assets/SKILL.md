---
name: designly-brand-assets
description: Rules for using DESIGNLY's brand assets — the official logo and the Viking/Celtic hero artwork. Use whenever a task touches the logo, the homepage hero, any header or navigation branding, favicons, or any request that would add, swap, or "improve" imagery on public-facing pages. Trigger even when the user does not name this skill, and especially before generating ANY image, because the default mistake is to invent replacement artwork instead of using the originals the user already supplied.
---

# DESIGNLY Brand Assets

DESIGNLY's identity depends on two specific, user-supplied images: the official DESIGNLY logo and the Viking/Celtic hero artwork. These are brand assets, not placeholders. Treat them the way you would treat a company's registered trademark — they are never yours to regenerate, restyle, or approximate.

## The core rule: never generate brand artwork

Do NOT create, generate, or AI-synthesize a logo or hero image for DESIGNLY. If the correct original asset is not present in the project, that is a problem to surface to the user, not a gap to fill with a generated substitute. Generating a replacement wastes credits, produces something subtly wrong, and quietly overwrites the real brand — the user has been explicit that this is the worst outcome.

The reasoning: a generated logo looks plausible but is not the brand. Once it ships, it is hard to tell the fake from the real one later, which is exactly the confusion that caused problems before. When in doubt, stop and ask rather than produce.

## Where the assets live

The originals belong in `public/` and are referenced from there:

- `public/designly-logo.webp` — the official DESIGNLY logo
- `public/designly-viking-hero.webp` — the Viking/Celtic hero artwork

If a file with the right name exists but you cannot confirm it is the genuine original, do NOT assume it is correct and do NOT overwrite it. Say plainly which files you can and cannot verify, and let the user confirm or re-upload.

## When an asset is missing or unverified

Conversation attachments are NOT project files. An image the user pasted into chat is visible to you but has not necessarily been written to disk. Before using an asset, confirm the actual file exists in `public/`. If it does not:

1. Do not generate a replacement.
2. Do not repurpose an unrelated image.
3. Tell the user, in plain words, to upload the original file through the project file-upload mechanism so it becomes a real project file, e.g.: "Please upload the original DESIGNLY logo and Viking/Celtic hero image using the file upload so they become actual project files."

Only continue the visual work once the real files are on disk.

## Hero composition standard

When the homepage hero is in scope and the real artwork is available, the intended look is: the original Viking/Celtic artwork behind a static central DESIGNLY logo, framed by a Celtic braided ornamental border whose outer ring rotates slowly while the logo stays still, with Norse/rune detailing, metallic gold accents, a black/graphite premium background, and subtle smoke, mist, and gold lighting. These are composition and CSS/animation choices layered around the real images — achieve them with styling, not by generating new artwork.

## Examples

Good: The hero references `public/designly-viking-hero.webp` and `public/designly-logo.webp`; the ornamental frame and rotation are done in CSS. A missing file triggers a clear request to re-upload.

Bad: The logo file is absent, so a "close enough" logo is generated and saved to `public/designly-logo.webp`. This is the exact failure this skill exists to prevent.
