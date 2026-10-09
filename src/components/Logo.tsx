export function LogoMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="12" cy="12" r="6.5" fill="none" stroke="currentColor" strokeWidth=".8" opacity=".5" />
      <path d="M8.6 12.2l2.4 2.4 4.4-4.8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** `compact`: the mark alone on phones, where the tab bar already says where you are */
export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark className={compact ? "h-6 w-6 text-gold sm:h-5 sm:w-5" : "h-5 w-5 text-gold"} />
      <span className={`font-serif text-[1.35rem] leading-none tracking-tight ${compact ? "hidden sm:inline" : ""}`}>
        Certified<span className="hidden italic text-mute min-[400px]:inline"> Series</span>
      </span>
    </span>
  );
}
