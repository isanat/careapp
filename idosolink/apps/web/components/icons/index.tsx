import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const baseProps = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const
};

export function IconCare(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 7.5c1.8-2.2 5.4-1.7 6.6 1.1 1.1 2.6-.5 5.6-6.6 9.9-6.1-4.3-7.7-7.3-6.6-9.9C6.6 5.8 10.2 5.3 12 7.5z" />
      <path d="M3.5 13.5c1.4 1 2.8 1.5 4.2 1.5h8.6c1.4 0 2.8-.5 4.2-1.5" />
    </svg>
  );
}

export function IconFamily(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="8" cy="8" r="2.5" />
      <circle cx="16" cy="9" r="2.5" />
      <path d="M4.5 18c.4-2.4 2.3-4 3.5-4h2c1.2 0 3.1 1.6 3.5 4" />
      <path d="M13.5 18c.3-1.8 1.6-3 2.8-3h1.2c1.2 0 2.5 1.2 2.8 3" />
    </svg>
  );
}

export function IconCaregiver(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="7" r="3" />
      <path d="M6.5 20c.6-3.1 3.1-5 5.5-5s4.9 1.9 5.5 5" />
      <rect x="15" y="12" width="6" height="6" rx="1.5" />
      <path d="M18 12v6" />
    </svg>
  );
}

export function IconContract(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h3" />
      <circle cx="18" cy="16" r="2" />
    </svg>
  );
}

export function IconWallet(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M3 7h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M3 7V6a2 2 0 0 1 2-2h12" />
      <circle cx="17" cy="12" r="1.5" />
    </svg>
  );
}

export function IconToken(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="12" r="7" />
      <path d="M9.5 10.5h5a1.5 1.5 0 0 1 0 3h-5" />
      <path d="M11.5 8v8" />
    </svg>
  );
}

export function IconReputation(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.5L12 15.8 7.2 18l.9-5.5-3.9-3.8 5.4-.8z" />
      <path d="M9.5 12.5l1.6 1.6 3.4-3.4" />
    </svg>
  );
}

export function IconSchedule(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 8v4l2.5 2.5" />
    </svg>
  );
}

export function IconPayment(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 15h4" />
    </svg>
  );
}

export function IconBurn(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 3c1.2 2 .8 4.2-.9 5.9-1.4 1.4-1.9 2.6-1.9 4.1a3.8 3.8 0 0 0 7.6 0c0-3.3-2-5.1-4.8-10z" />
    </svg>
  );
}

export function IconSupport(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M4 12a8 8 0 1 1 16 0" />
      <rect x="3" y="12" width="4" height="6" rx="2" />
      <rect x="17" y="12" width="4" height="6" rx="2" />
      <path d="M8 20h4" />
    </svg>
  );
}
