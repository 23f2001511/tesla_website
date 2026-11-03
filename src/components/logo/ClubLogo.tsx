import Image from 'next/image';

/**
 * Official TESLA Club logo — dark-theme version of /images/tesla-logo.png.
 * Same artwork pixel-for-pixel (bulb, turbine, TESLA wordmark, institute
 * line); the dark ink was recolored to ivory tones so the logo renders at
 * full clarity on the site's dark ink surfaces. Used in the public navbar
 * and footer. The dashboard/admin sidebars use <SidebarLogo>, which renders
 * the same generated asset.
 * The full lockup (bulb + turbine + "TESLA" + institute name) is baked into
 * the image, so it renders as a standalone logo with NO extra text beside it.
 * Rendered with next/image at explicit dimensions (no layout shift) and
 * object-contain (never stretched).
 */

const LOGO_SRC = '/images/tesla-logo-dark.png';
const LOGO_ALT = 'TESLA - Technical Club NIT Patna';
// Intrinsic size of the source PNG — next/image uses this so the logo stays
// crisp when downscaled to navbar/footer/sidebar sizes.
const INTRINSIC = 200;

/** Logo-only lockup. No box / rounding — renders as a clean transparent logo. */
export function ClubLogoMark({ size = 40, className = '' }: { size?: number; className?: string }) {
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

/** Alias kept for existing usages — renders the logo only (no side text). */
export function ClubLogo({ size = 40, className = '' }: { size?: number; className?: string }) {
  return <ClubLogoMark size={size} className={className} />;
}