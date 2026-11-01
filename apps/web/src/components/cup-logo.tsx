type CupLogoProps = {
  className?: string;
};

export function CupLogo({ className = "w-10 h-10" }: CupLogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* Vapor do café */}
      <path
        d="M24 18C22 14 26 11 24 7"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M33 16C31 12 35 9 33 5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M42 18C40 14 44 11 42 7"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Corpo da xícara */}
      <path
        d="M14 25H48L45 43C44.2 48.2 39.7 52 34.4 52H27.6C22.3 52 17.8 48.2 17 43L14 25Z"
        fill="var(--color-latte)"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      {/* Asa da xícara */}
      <path
        d="M47.5 29H51C54.9 29 58 32.1 58 36C58 39.9 54.9 43 51 43H45.5"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* Pires */}
      <path
        d="M10 56C20 58.5 42 58.5 52 56"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
