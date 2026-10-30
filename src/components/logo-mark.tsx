export function LogoMark({ className, monochrome }: { className?: string; monochrome?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path
        d="M85 20 L38 20 L18 38 L65 38 L45 56 L15 56 L15 80 L62 80 L82 62 L35 62 L55 44 L85 44 Z"
        fill={monochrome ? "currentColor" : "#111827"}
      />
      <path
        d="M85 20 L38 20 L18 38 L65 38 L48 53 L85 53 L85 44 L55 44 Z"
        fill={monochrome ? "currentColor" : "#dc2626"}
        opacity={monochrome ? 0.6 : 1}
      />
    </svg>
  );
}
