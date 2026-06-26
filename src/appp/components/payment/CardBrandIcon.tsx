import type { CardType } from "../../utils/paymentValidation";

const iconClass = "h-7 w-11 shrink-0 object-contain";

function VisaIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 48 32" aria-hidden>
      <rect width="48" height="32" rx="4" fill="#1A1F71" />
      <path
        fill="#fff"
        d="M20.2 11.2h-2.1l1.3 8h2.1l-1.3-8zm8.4-.2c-.5-.2-1.3-.4-2.3-.4-2.5 0-4.3 1.3-4.3 3.1 0 1.4 1.3 2.1 2.3 2.6 1 .5 1.4.8 1.4 1.2 0 .7-.8 1-1.6 1-1.1 0-1.7-.2-2.6-.6l-.4-.2-.6 1.8c.7.3 2 .6 3.4.6 2.7 0 4.4-1.3 4.4-3.2 0-1.1-.7-1.9-2.2-2.6-1-.5-1.5-.8-1.5-1.3 0-.4.5-.9 1.5-.9.9 0 1.6.2 2.1.4l.3.1.5-1.7zm6.1 0c-.8 0-1.4.2-1.7 1.1l-3 7.1h2.2l.4-1.2h2.7l.2 1.2h1.9l-1.7-8.2h-1.6zm.3 2.6.6 3.2h-1.8l1.2-3.2zm-12.8-2.6-1.7 5.5-.7-3.7c-.2-.8-.7-1.1-1.4-1.1h-3.5l-.1.4c.9.2 1.8.5 2.4.8l2.1 5.6h2.2l3.3-8.2h-2.1z"
      />
    </svg>
  );
}

function MastercardIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 48 32" aria-hidden>
      <rect width="48" height="32" rx="4" fill="#000" />
      <circle cx="19" cy="16" r="9" fill="#EB001B" />
      <circle cx="29" cy="16" r="9" fill="#F79E1B" />
      <path
        fill="#FF5F00"
        d="M24 10.5a8.9 8.9 0 0 1 0 11 8.9 8.9 0 0 1 0-11z"
      />
    </svg>
  );
}

function AmexIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 48 32" aria-hidden>
      <rect width="48" height="32" rx="4" fill="#016FD0" />
      <path
        fill="#fff"
        d="M8 12h3.2l.7 1.7.7-1.7H16v5.2h-2v-3.9l-1 2.4h-1.7l-1-2.4v3.9H8V12zm9.5 0h4.3v1.3h-2.8v.9h2.7v1.2h-2.7v.5h2.8v1.3h-4.5V12zm5.8 0H26l2 5.2h-2.1l-.4-1h-2.1l-.4 1h-2l2-5.2zm1.1 3 .6-1.5.6 1.5h-1.2zm4.3-3h2.3c.7 0 1.2.2 1.5.5.3.3.4.7.4 1.2 0 .6-.2 1-.6 1.3l.9 2.2h-2.1l-.6-1.6h-.6v1.6H33V12zm2 2.5c.3 0 .5-.1.6-.3.1-.2.2-.4.2-.6 0-.3-.1-.5-.2-.6-.1-.2-.3-.2-.6-.2h-.4v1.7h.4z"
      />
    </svg>
  );
}

type Props = { type: CardType; className?: string };

export function CardBrandIcon({ type, className }: Props) {
  const wrap = `pointer-events-none flex items-center justify-end ${className ?? ""}`;
  if (type === "visa") {
    return (
      <span className={wrap} title="Visa">
        <VisaIcon />
      </span>
    );
  }
  if (type === "mastercard") {
    return (
      <span className={wrap} title="Mastercard">
        <MastercardIcon />
      </span>
    );
  }
  if (type === "amex") {
    return (
      <span className={wrap} title="American Express">
        <AmexIcon />
      </span>
    );
  }
  return null;
}
