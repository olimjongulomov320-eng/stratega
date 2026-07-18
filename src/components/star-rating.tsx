export function StarRating({
  rating,
  reviewCount,
  size = "sm",
}: {
  rating: number;
  reviewCount?: number;
  size?: "sm" | "md";
}) {
  const starSize = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i + 1 <= Math.round(rating);
          return (
            <svg
              key={i}
              viewBox="0 0 20 20"
              fill={filled ? "#f59e0b" : "#e5e7eb"}
              className={starSize}
            >
              <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.79L10 14.9l-5.2 2.61.99-5.79-4.21-4.1 5.82-.85z" />
            </svg>
          );
        })}
      </div>
      {reviewCount !== undefined && (
        <span className={`${textSize} text-slate-500`}>({reviewCount})</span>
      )}
    </div>
  );
}
