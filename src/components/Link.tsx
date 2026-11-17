import NextLink from "next/link";
import type { ComponentProps } from "react";

/**
 * next/link without the automatic prefetch. By default every link that
 * scrolls into view fetches its page in the background: with the header, tab
 * bar and footer that was a dozen server requests per page view, each one
 * counted by the hosting plan. Pages now load on click. (Prefetching on hover
 * was tried: it cost two requests per hovered link and the click still needed
 * a third.) Pass `prefetch` to opt a link back in.
 */
export default function Link({ prefetch = false, ...props }: ComponentProps<typeof NextLink>) {
  return <NextLink prefetch={prefetch} {...props} />;
}
