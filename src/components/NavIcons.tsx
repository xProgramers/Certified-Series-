type IconProps = { className?: string };

export function SearchIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden>
      <circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13.2 13.2L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function HomeIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden>
      <path
        d="M3.5 9L10 3.5 16.5 9v7a.5.5 0 01-.5.5h-3.5v-5h-5v5H4a.5.5 0 01-.5-.5V9z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CollectionIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden>
      <rect x="3" y="4" width="6" height="9" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="7" width="6" height="9" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function MedalIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden>
      <circle cx="10" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 8.2L5 3h3l2 4M13 8.2L15 3h-3l-2 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
