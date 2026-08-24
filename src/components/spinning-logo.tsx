import Image from "next/image";

type SpinningLogoProps = {
  /** Rendered size in px. */
  size?: number;
  /** Seconds per full turn — slower reads as heavier. */
  speed?: number;
  className?: string;
  priority?: boolean;
};

/**
 * The mark spins on its Y axis like a coin. Pure CSS transform, so it costs
 * nothing on the main thread and stops for prefers-reduced-motion.
 */
export function SpinningLogo({ size = 32, speed = 7, className = "", priority }: SpinningLogoProps) {
  return (
    <span
      className={`spin-coin relative block shrink-0 overflow-hidden rounded-full ring-1 ring-black/10 ${className}`}
      style={{ width: size, height: size, animationDuration: `${speed}s` }}
    >
      <Image
        src="/logo.png"
        alt=""
        fill
        sizes={`${size * 2}px`}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        className="scale-[1.35] object-cover"
      />
    </span>
  );
}
