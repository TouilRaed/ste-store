"use client";

import Image from "next/image";
import { useState } from "react";

type ProductImageProps = {
  src: string | null | undefined;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
};

/**
 * Fills its (positioned) parent. Falls back to a woven paper gradient if the
 * remote shot 404s, so a broken URL never leaves a white hole in the grid.
 */
export function ProductImage({ src, alt, sizes, priority, className }: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(120%_100%_at_20%_0%,#f7f2e8_0%,#ebe4d8_45%,#ddd3c2_100%)]"
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      onError={() => setFailed(true)}
      // `priority` is deprecated in Next 16 — eager + high fetch priority is
      // the explicit replacement for an above-the-fold LCP image.
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      className={className}
    />
  );
}
