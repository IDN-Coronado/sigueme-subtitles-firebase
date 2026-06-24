import { useState, useEffect, useRef } from "react";

function ThemeDropdown({ themes, value, onSelect }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();

  // Close on Escape or click outside
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="border rounded px-3 py-2 w-full flex items-center justify-between"
        onClick={() => setOpen((v) => !v)}
      >
        {value
          ? (
            <div className="flex items-center gap-2">
              <span>
                <img
                  src={themes.find(t => t.id === value)?.backgroundUrl}
                  alt=""
                  className="w-8 h-5 object-cover rounded"
                />
              </span>
              <span>{themes.find(t => t.id === value)?.title}</span>
            </div>
          )
          : <span className="text-gray-400">Selecciona un tema</span>
        }
        <span className="ml-2">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="absolute z-20 bg-white border rounded shadow w-full mt-1 max-h-60 overflow-auto">
          {themes.map(theme => (
            <div
              key={theme.id}
              className="flex items-center gap-2 px-3 py-2 hover:bg-cyan-50 cursor-pointer"
              onClick={() => { onSelect(theme.id); setOpen(false); }}
            >
              <img
                src={theme.backgroundUrl}
                alt=""
                className="w-8 h-5 object-cover rounded"
              />
              <span>{theme.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ThemeDropdown;