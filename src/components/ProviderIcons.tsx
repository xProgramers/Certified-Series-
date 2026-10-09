import { logoUrl } from "@/lib/images";
import { brand, providerInitials, type WatchProvider } from "@/lib/providers";

/**
 * Streaming services as their official logos: 16px on posters, 18px on the page. "overlay" sits on
 * a poster's corner; "plain" follows the page theme. Without a logo (sample
 * catalog) a small letter mark stands in.
 */
export function ProviderIcons({
  providers,
  max = 3,
  tone = "overlay",
  className = "",
}: {
  providers: WatchProvider[];
  max?: number;
  tone?: "overlay" | "plain";
  className?: string;
}) {
  if (!providers.length) return null;
  const shown = providers.slice(0, max);
  const rest = providers.length - shown.length;
  const names = providers.map((p) => p.name).join(", ");
  return (
    <ul className={`flex items-center gap-1 ${className}`} aria-label={`Disponível em ${names}`} title={names}>
      {shown.map((p) => (
        <li key={p.key}>
          <ProviderMark provider={p} tone={tone} />
        </li>
      ))}
      {rest > 0 && (
        <li>
          <span className={`${chip(tone)} px-1 font-mono text-[9px]`} aria-hidden>
            +{rest}
          </span>
        </li>
      )}
    </ul>
  );
}

const chip = (tone: "overlay" | "plain") =>
  `grid h-[18px] min-w-[18px] place-items-center rounded-[5px] leading-none ${
    tone === "overlay"
      ? "bg-black/55 text-white/85 ring-1 ring-white/12 backdrop-blur-sm"
      : "bg-ink-3 text-paper/80 ring-1 ring-line"
  }`;

export function ProviderMark({ provider, tone = "overlay" }: { provider: WatchProvider; tone?: "overlay" | "plain" }) {
  if (provider.logoPath) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl(provider.logoPath) ?? undefined}
        alt={provider.name}
        title={provider.name}
        loading="lazy"
        decoding="async"
        className={`block object-cover ${
          tone === "overlay"
            ? "size-4 rounded-[4px] shadow-[0_1px_3px_rgb(0_0_0/0.5)] ring-1 ring-white/15"
            : "size-[18px] rounded-[5px] ring-1 ring-line"
        }`}
      />
    );
  }
  const b = brand(provider.key);
  const mark = b?.mark ?? providerInitials(provider.name);
  return (
    <span
      className={`${chip(tone)} px-[4px] font-sans text-[9.5px] font-semibold tracking-[-0.02em]`}
      title={provider.name}
      aria-label={provider.name}
      role="img"
    >
      {mark}
    </span>
  );
}
