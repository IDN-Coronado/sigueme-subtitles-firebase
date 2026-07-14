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

export function IconBroadcast() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
      <path d="M1 7h18M7 1l-6 6 6 6M13 1l6 6-6 6" stroke="#00354a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
