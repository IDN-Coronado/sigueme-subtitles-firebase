export function IconCalendar({ color = "#e0e3e5" }) {
  return (
    <svg width="18" height="20" viewBox="0 0 18 20" fill="none">
      <rect x="1" y="3" width="16" height="16" rx="2" stroke={color} strokeWidth="1.5" />
      <path d="M5 1v4M13 1v4M1 9h16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="8" cy="8" r="6" stroke="#6b7280" strokeWidth="1.5" />
      <path d="m13 13 3 3" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconPlus({ color = "#00354a" }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 4v12M4 10h12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconBroadcast({ color = "currentColor" }) {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" fill="none" aria-hidden>
      <path
        d="M1 7h18M7 1l-6 6 6 6M13 1l6 6-6 6"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconDots() {
  return (
    <svg width="4" height="16" viewBox="0 0 4 16" fill="none">
      <circle cx="2" cy="2" r="1.5" fill="#6b7280" />
      <circle cx="2" cy="8" r="1.5" fill="#6b7280" />
      <circle cx="2" cy="14" r="1.5" fill="#6b7280" />
    </svg>
  );
}

export function IconGear({ color = "currentColor" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.75" />
    </svg>
  );
}

export function IconEdit() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M2 13.5V16h2.5L13 7.5 10.5 5 2 13.5z" stroke="#c6c6cd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.5 5L13 2.5l2.5 2.5-2.5 2.5L10.5 5z" stroke="#c6c6cd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconTrash() {
  return (
    <svg width="16" height="18" viewBox="0 0 16 18" fill="none">
      <path d="M1 4h14M6 4V2h4v2M3 4l1 12h8l1-12" stroke="#c6c6cd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconChevron({ collapsed }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 16 16" fill="none"
      className={`transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
    >
      <path d="M10 12L6 8l4-4" stroke="#c6c6cd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconPlay({ color = "currentColor" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M4 2.5v11l10-5.5L4 2.5z" fill={color} />
    </svg>
  );
}

export function IconPause({ color = "currentColor" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="3.5" y="2.5" width="3" height="11" rx="0.5" fill={color} />
      <rect x="9.5" y="2.5" width="3" height="11" rx="0.5" fill={color} />
    </svg>
  );
}

export function IconStop({ color = "currentColor" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="3.5" y="3.5" width="9" height="9" rx="1" fill={color} />
    </svg>
  );
}

export function IconLoop({ color = "currentColor" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M12.5 3.5H6a3.5 3.5 0 0 0 0 7h.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M10.5 1.5 12.5 3.5 10.5 5.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 12.5H10a3.5 3.5 0 0 0 0-7h-.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M5.5 14.5 3.5 12.5 5.5 10.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconSlideFirst({ color = "currentColor" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3.5 3.5v9" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M12.5 3.5 7 8l5.5 4.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconSlidePrev({ color = "currentColor" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M10.5 3.5 5.5 8l5 4.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconSlideNext({ color = "currentColor" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M5.5 3.5 10.5 8l-5 4.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconSlideLast({ color = "currentColor" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M12.5 3.5v9" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M3.5 3.5 9 8l-5.5 4.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconSong({ color = "currentColor" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M6 12.5a2 2 0 1 1-2-2"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M8 12.5V3.5l6-1v9"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 11.5a2 2 0 1 1-2-2"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconMedia({ color = "currentColor" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke={color} strokeWidth="1.5" />
      <path d="M6.5 6l4 2.5-4 2.5V6z" fill={color} />
    </svg>
  );
}

export function IconBible({ color = "currentColor" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3 2.5h8.5A1.5 1.5 0 0 1 13 4v9.5H4.5A1.5 1.5 0 0 0 3 15"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3 2.5v12.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6.5 6h4M8.5 6v4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconTheme({ color = "currentColor" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke={color} strokeWidth="1.5" />
      <path d="M8 2.5v11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconGrip({ color = "currentColor" }) {
  return (
    <svg width="12" height="16" viewBox="0 0 12 16" fill="none" aria-hidden>
      <circle cx="3.5" cy="3" r="1.25" fill={color} />
      <circle cx="8.5" cy="3" r="1.25" fill={color} />
      <circle cx="3.5" cy="8" r="1.25" fill={color} />
      <circle cx="8.5" cy="8" r="1.25" fill={color} />
      <circle cx="3.5" cy="13" r="1.25" fill={color} />
      <circle cx="8.5" cy="13" r="1.25" fill={color} />
    </svg>
  );
}

export function IconTextDecrease({ color = "currentColor" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3 12.5 6.5 3.5h1.2L11.2 12.5M4.2 9.5h5.4"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12.5 11h3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconTextIncrease({ color = "currentColor" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2.5 12.5 6.5 3h1.3L11.8 12.5M3.8 9.2h6.2"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 8.5v4M11 10.5h4"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconCc({ color = "currentColor" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect
        x="1.5"
        y="3.5"
        width="13"
        height="9"
        rx="1.5"
        stroke={color}
        strokeWidth="1.5"
      />
      <path
        d="M5.2 9.6a1.7 1.7 0 0 1-1.2-.4 1.5 1.5 0 0 1-.5-1.2c0-.5.2-.9.5-1.2.3-.3.7-.5 1.2-.5.4 0 .7.1 1 .3l-.4.7a.9.9 0 0 0-.6-.2c-.2 0-.4.1-.5.2-.1.1-.2.3-.2.5s.1.4.2.5c.1.1.3.2.5.2.2 0 .4-.1.6-.2l.4.7c-.3.2-.7.3-1.1.3Zm5.3 0a1.7 1.7 0 0 1-1.2-.4 1.5 1.5 0 0 1-.5-1.2c0-.5.2-.9.5-1.2.3-.3.7-.5 1.2-.5.4 0 .7.1 1 .3l-.4.7a.9.9 0 0 0-.6-.2c-.2 0-.4.1-.5.2-.1.1-.2.3-.2.5s.1.4.2.5c.1.1.3.2.5.2.2 0 .4-.1.6-.2l.4.7c-.3.2-.7.3-1.1.3Z"
        fill={color}
      />
    </svg>
  );
}

export function IconAlignLeft({ color = "currentColor" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2.5 3.5h11M2.5 6.5h7M2.5 9.5h11M2.5 12.5h7"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconAlignCenter({ color = "currentColor" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2.5 3.5h11M4.5 6.5h7M2.5 9.5h11M4.5 12.5h7"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconAlignRight({ color = "currentColor" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2.5 3.5h11M6.5 6.5h7M2.5 9.5h11M6.5 12.5h7"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
