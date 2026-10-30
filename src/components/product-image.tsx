import Image from "next/image";

// Only our own files and the Vercel Blob store are optimised; any other URL is shown as-is
// (next/image would throw for a host that is not in next.config.ts remotePatterns).
const OPTIMIZABLE = /^\/(?!\/)|^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i;

/** Product / category photo that fills its box. The parent box sets the size; this adds `relative`. */
export function ProductImage({
  src,
  alt,
  sizes,
  className = "",
  eager = false,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  eager?: boolean;
}) {
  return (
    <span className="relative block h-full w-full">
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        unoptimized={!OPTIMIZABLE.test(src)}
        className={`object-contain ${className}`}
      />
    </span>
  );
}
