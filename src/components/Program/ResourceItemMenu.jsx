import { useEffect, useRef, useState } from "react";

import { IconGear } from "../Icons";
import { t } from "../../i18n";

function ResourceItemMenu({ options }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
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
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        title={t("resourceMenu.options")}
        aria-label={t("resourceMenu.options")}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center justify-center p-0.5 text-fg-muted hover:text-primary-fg transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <IconGear />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-30 min-w-[10.5rem] py-1 rounded-sm border border-[rgba(69,70,77,0.45)] bg-card shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
        >
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="menuitem"
              className={`w-full text-left px-3 py-2 text-xs sm:text-sm transition-colors ${
                opt.danger
                  ? "text-danger-fg hover:bg-[rgba(147,0,10,0.2)]"
                  : "text-fg hover:bg-primary/10 hover:text-primary-fg"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                opt.onClick?.();
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ResourceItemMenu;
