import { MONO } from "./constants";

function ItemSettingsPanel() {
  return (
    <div className="opacity-50 pointer-events-none select-none flex flex-col gap-6 p-1">
      <div>
        <p
          className="text-[#c6c6cd] text-xs tracking-[0.06em] mb-3"
          style={MONO}
        >
          TEXT CONFIGURATION
        </p>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[#c6c6cd] text-sm">Font Size</span>
          <span className="text-[#7bd0ff] text-sm underline" style={MONO}>
            36px
          </span>
        </div>
        <div className="flex gap-2">
          {["L", "C", "R"].map((align) => (
            <div
              key={align}
              className={`w-10 h-9 rounded-sm border flex items-center justify-center text-xs ${
                align === "C"
                  ? "border-[#7bd0ff] text-[#7bd0ff]"
                  : "border-[rgba(69,70,77,0.4)] text-[#6b7280]"
              }`}
            >
              {align}
            </div>
          ))}
        </div>
      </div>
      <div>
        <p
          className="text-[#c6c6cd] text-xs tracking-[0.06em] mb-3"
          style={MONO}
        >
          TRANSITION STYLE
        </p>
        <div className="bg-[#0b0f10] border border-[rgba(69,70,77,0.35)] rounded-sm px-3 py-2.5 text-[#c6c6cd] text-sm">
          Cross Dissolve (0.5s)
        </div>
      </div>
      <p className="text-[#6b7280] text-xs">Próximamente</p>
    </div>
  );
}

export default ItemSettingsPanel;
