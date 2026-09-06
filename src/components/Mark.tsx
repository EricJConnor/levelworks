/**
 * The LevelWorks mark: a spirit level with the bubble centred.
 * Level means true — the same mark the marketing site carries.
 */
export function Mark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect x="1.5" y="8.5" width="25" height="11" rx="3.5" stroke="currentColor" strokeWidth="2" />
      <rect x="10" y="11" width="8" height="6" rx="2" fill="#2563eb" />
      <path d="M8.5 9v10M19.5 9v10" stroke="currentColor" strokeWidth="1.5" strokeOpacity=".35" />
    </svg>
  );
}
