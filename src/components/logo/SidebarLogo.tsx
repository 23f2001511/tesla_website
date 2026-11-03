import Image from 'next/image';

/**
 * Dark-mode sidebar logo — the SAME official TESLA artwork as the public
 * logo (/images/tesla-logo.png), recolored for dark surfaces:
 * every line and shape is identical; only the dark ink wordmark/institute
 * text was inverted to ivory tones (teal bulb outline and yellow turbine
 * kept as-is). Generated from the source asset, never redrawn.
 *
 * Used in the dashboard/admin sidebars, where the original dark-ink logo
 * washes out on the near-black background.
 */

const LOGO_SRC = '/images/tesla-logo-dark.png';
const LOGO_ALT = 'TESLA - Technical Club NIT Patna';
const INTRINSIC = 200; // intrinsic size of the source PNG (crisp at any downscale)

export function SidebarLogo({
  size = 64,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`relative inline-flex items-center justify-center leading-none shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={LOGO_SRC}
        alt={LOGO_ALT}
        width={INTRINSIC}
        height={INTRINSIC}
        className="w-full h-full object-contain"
        draggable={false}
      />
    </span>
  );
}