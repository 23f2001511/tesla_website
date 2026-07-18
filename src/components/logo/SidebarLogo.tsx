import { Logo } from './Logo';

interface SidebarLogoProps {
  size?: number;
  className?: string;
}

export function SidebarLogo({
  size,
  className = '',
}: SidebarLogoProps) {
  return (
    <Logo
      variant="sidebar"
      className={className}
    />
  );
}