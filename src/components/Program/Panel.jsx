import { MONO } from "./constants";

function Panel({ title, action, children, className = "", style, bodyClassName = "" }) {
  return (
    <section
      style={style}
      className={`bg-[#111521] border border-[rgba(255,255,255,0.08)] rounded-xl flex flex-col min-h-0 overflow-hidden ${className}`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.06)] shrink-0">
        <h3
          className="text-[#9AA3B2] text-[10px] font-semibold tracking-[0.12em] uppercase"
          style={MONO}
        >
          {title}
        </h3>
        {action}
      </div>
      <div className={`flex-1 min-h-0 overflow-auto p-3 ${bodyClassName}`}>
        {children}
      </div>
    </section>
  );
}

export default Panel;
