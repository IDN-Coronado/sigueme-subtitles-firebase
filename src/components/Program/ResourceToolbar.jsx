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

function ResourceToolbar({
  query,
  onQueryChange,
  placeholder,
  createLabel,
  onCreate,
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
      <SearchField
        value={query}
        onChange={onQueryChange}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={onCreate}
        className="shrink-0 inline-flex items-center gap-1.5 bg-[rgba(123,208,255,0.1)] border border-[rgba(123,208,255,0.3)] text-[#7bd0ff] text-sm font-medium px-3 py-2.5 rounded-sm hover:bg-[rgba(123,208,255,0.18)] transition-colors"
      >
        <IconPlus color="currentColor" />
        <span className="hidden sm:inline">{createLabel}</span>
      </button>
    </div>
  );
}

export default ResourceToolbar;
