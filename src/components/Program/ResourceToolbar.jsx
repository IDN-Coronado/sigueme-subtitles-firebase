import { IconPlus, IconSearch } from "../Icons";

function SearchField({ value, onChange, placeholder }) {
  return (
    <div className="relative w-full min-w-0 flex-1 max-w-md">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <IconSearch />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-[#0b0f10] text-[#e0e3e5] placeholder-[#6b7280] text-sm rounded-sm pl-10 pr-4 py-2.5 w-full outline-none border border-[rgba(69,70,77,0.3)] focus:border-[#7bd0ff] transition-colors"
      />
    </div>
  );
}

function ToolbarButton({ label, onClick, variant = "primary" }) {
  const styles =
    variant === "secondary"
      ? "bg-[rgba(50,53,55,0.45)] border border-[rgba(69,70,77,0.45)] text-[#c6c6cd] hover:border-[rgba(123,208,255,0.35)] hover:text-[#7bd0ff]"
      : "bg-[rgba(123,208,255,0.1)] border border-[rgba(123,208,255,0.3)] text-[#7bd0ff] hover:bg-[rgba(123,208,255,0.18)]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2.5 rounded-sm transition-colors ${styles}`}
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
