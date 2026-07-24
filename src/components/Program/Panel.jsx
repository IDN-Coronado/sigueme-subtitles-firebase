import { MONO } from "./constants";

function Panel({ title, action, children, className = "", style, bodyClassName = "" }) {
  return (
    <section
      style={style}
      className={`bg-[rgba(29,32,34,0.5)] border border-[rgba(69,70,77,0.35)] rounded-lg flex flex-col min-h-0 overflow-hidden ${className}`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(69,70,77,0.25)] shrink-0">
        <h3
          className="text-[#c6c6cd] text-xs font-medium tracking-[0.08em] uppercase"
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
