import { IconPlus, IconSearch } from "../Icons";

function SearchField({ value, onChange, placeholder }) {
  return (
    <div className="relative w-full min-w-0 flex-1 max-w-md">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <IconSearch color="#9AA3B2" />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-[#171C2B] text-[#F8FAFC] placeholder-[#9AA3B2] text-sm rounded-lg pl-10 pr-4 py-2.5 w-full outline-none border border-[rgba(255,255,255,0.08)] focus:border-[#6366F1] transition-colors"
      />
    </div>
  );
}

function ToolbarButton({ label, onClick, variant = "primary" }) {
  const styles =
    variant === "secondary"
      ? "bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#9AA3B2] hover:border-[rgba(99,102,241,0.4)] hover:text-[#7C83FF]"
      : "bg-[rgba(99,102,241,0.15)] border border-[rgba(99,102,241,0.3)] text-[#7C83FF] hover:bg-[rgba(99,102,241,0.25)]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2.5 rounded-lg transition-colors ${styles}`}
    >
      <IconPlus color="currentColor" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function ResourceToolbar({
  query,
  onQueryChange,
  placeholder,
  createLabel,
  onCreate,
  secondaryLabel,
  onSecondary,
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
      <SearchField
        value={query}
        onChange={onQueryChange}
        placeholder={placeholder}
      />
      {createLabel && onCreate && (
        <ToolbarButton label={createLabel} onClick={onCreate} />
      )}
      {secondaryLabel && onSecondary && (
        <ToolbarButton
          label={secondaryLabel}
          onClick={onSecondary}
          variant="secondary"
        />
      )}
    </div>
  );
}

export default ResourceToolbar;
