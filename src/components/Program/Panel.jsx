import { MONO } from "../../fonts";

function Panel({ title, action, children, className = "", style, bodyClassName = "" }) {
  return (
    <section
      style={style}
      className={`bg-surface border border-hairline rounded-xl flex flex-col min-h-0 overflow-hidden ${className}`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.06)] shrink-0">
        <h3
          className="text-fg-muted text-[10px] font-semibold tracking-[0.12em] uppercase"
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
