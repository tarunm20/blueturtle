import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@kit/ui/utils';

// Different size variants for different contexts
type LogoSize = 'small' | 'medium' | 'large';

export function AppLogo({
  href,
  label,
  className,
  size = 'medium',
}: {
  href?: string | null;
  className?: string;
  label?: string;
  size?: LogoSize;
}) {
  // Size mappings for different contexts
  const sizeMap = {
    small: {
      width: 60,
      height: 60,
      className: "w-[60px] max-h-[35px]"
    },
    medium: {
      width: 85,
      height: 85,
      className: "w-[85px] max-h-[50px]"
    },
    large: {
      width: 120,
      height: 120,
      className: "w-[120px] max-h-[70px]"
    }
  };

  const { width, height, className: sizeClassName } = sizeMap[size];

  // Create logo element with appropriate sizing
  const logoElement = (
    <div className={cn("relative flex items-center", className)}>
      <Image
        src="/images/bt_logo.png"
        alt="BlueTurtle Logo"
        width={width}
        height={height}
        className={cn("h-auto object-contain", sizeClassName)}
        priority
      />
    </div>
  );

  // If href is explicitly set to null, just render the logo without a link
  if (href === null) {
    return logoElement;
  }

  // Otherwise, render the logo inside a link
  return (
    <Link aria-label={label ?? 'Home Page'} href={href ?? '/'}>
      {logoElement}
    </Link>
  );
}