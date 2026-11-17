Fonts drawn into the share images (`src/app/card/[id]/opengraph-image.tsx`):
the latin subsets of Instrument Serif and Geist Mono (from Fontsource), the
same faces the site loads with `next/font`. Both are under the SIL Open Font
License (copies alongside).

The `.woff` files live in `public/fonts/`: on Cloudflare the Worker has no file
system, so the image reads them from the static assets (the `ASSETS` binding).
