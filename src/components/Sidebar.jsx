import { Link } from "react-router-dom";
import { IconCalendar, IconBroadcast, IconChevron } from "./Icons";

function Sidebar({ activeItem = "programs", collapsed = false, onToggle }) {
  const c = collapsed; // shorthand

  const navItemBase = `flex items-center py-2 rounded-sm text-[#c6c6cd] hover:bg-[rgba(50,53,55,0.2)] transition-colors ${c ? "justify-center px-2" : "gap-4 px-4"}`;

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-[#101415] border-r border-[rgba(69,70,77,0.3)] flex flex-col justify-between py-6 z-30 transition-all duration-200 overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.35)] ${c ? "w-[72px] px-2" : "w-[280px] px-4"}`}
    >
      {/* Logo + Nav */}
      <div>
        {/* Logo row */}
        <div className={`mb-10 flex items-center ${c ? "justify-center" : "justify-between px-2"}`}>
          {!c && (
            <div>
              <h1 className="text-[#e0e3e5] font-bold text-2xl tracking-tight leading-8">
                <Link to="/">Presenter Pro</Link>
              </h1>
              <p
                className="text-[#c6c6cd] text-xs font-medium tracking-[0.1em] uppercase opacity-60 leading-4 mt-1"
                style={{ fontFamily: "JetBrains Mono, monospace" }}
              >
                LIVE CONSOLE
              </p>
            </div>
          )}
          <button
            onClick={onToggle}
            className="p-1 rounded-sm text-[#c6c6cd] hover:bg-[rgba(50,53,55,0.2)] transition-colors shrink-0"
            title={c ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            <IconChevron collapsed={c} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1">
          {activeItem === "programs" ? (
            <div className={`flex items-center py-2 rounded-sm bg-[rgba(50,53,55,0.2)] border-r-4 border-[#7bd0ff] ${c ? "justify-center px-2" : "gap-4 px-4"}`}>
              <IconCalendar color="#7bd0ff" />
              {!c && <span className="text-[#7bd0ff] font-bold text-base leading-6">Programas</span>}
            </div>
          ) : (
            <Link to="/" className={navItemBase}>
              <IconCalendar />
              {!c && <span className="text-base leading-6">Programas</span>}
            </Link>
          )}

          <Link to="/" className={navItemBase}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
              <path d="M9 3H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" stroke="#c6c6cd" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M14 2l4 4-7 7H7v-4l7-7z" stroke="#c6c6cd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {!c && <span className="text-base leading-6">Canciones</span>}
          </Link>

          <Link to="/" className={navItemBase}>
            <svg width="22" height="16" viewBox="0 0 22 16" fill="none" className="shrink-0">
              <rect x="1" y="1" width="20" height="14" rx="2" stroke="#c6c6cd" strokeWidth="1.5" />
              <path d="M11 1v14" stroke="#c6c6cd" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {!c && <span className="text-base leading-6">Temas</span>}
          </Link>
        </nav>
      </div>

      {/* Bottom section */}
      <div className="flex flex-col gap-1">
        {/* Go Live */}
        <button className={`bg-[#7bd0ff] text-[#00354a] font-bold text-base py-4 rounded-sm flex items-center justify-center hover:bg-[#5bc0ef] transition-colors mb-2 ${!c && "gap-2"}`}>
          <IconBroadcast />
          {!c && "Go Live"}
        </button>

        {/* Divider */}
        <div className="border-t border-[rgba(69,70,77,0.3)] pt-2 flex flex-col gap-1">
          <div className={`flex items-center py-2 rounded-sm text-[#c6c6cd] hover:bg-[rgba(50,53,55,0.2)] transition-colors cursor-pointer ${c ? "justify-center px-2" : "gap-4 px-4"}`}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
              <circle cx="10" cy="10" r="3" stroke="#c6c6cd" strokeWidth="1.5" />
              <path d="M10 1v2m0 14v2M1 10h2m14 0h2M3.2 3.2l1.4 1.4m10.8 10.8 1.4 1.4M3.2 16.8l1.4-1.4m10.8-10.8 1.4-1.4" stroke="#c6c6cd" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {!c && <span className="text-base leading-6">Configuración</span>}
          </div>
          <div className={`flex items-center py-2 rounded-sm text-[#c6c6cd] hover:bg-[rgba(50,53,55,0.2)] transition-colors cursor-pointer ${c ? "justify-center px-2" : "gap-4 px-4"}`}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
              <circle cx="10" cy="10" r="9" stroke="#c6c6cd" strokeWidth="1.5" />
              <path d="M10 14v-4m0-4h.01" stroke="#c6c6cd" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {!c && <span className="text-base leading-6">Soporte</span>}
          </div>
        </div>

        {/* User profile */}
        <div className={`flex items-center border-t border-[rgba(69,70,77,0.3)] pt-4 mt-2 ${c ? "justify-center" : "gap-4"}`}>
          <div className="w-10 h-10 rounded-xl bg-[#272a2c] border border-[#45464d] flex items-center justify-center text-[#e0e3e5] font-bold text-sm shrink-0">
            A
          </div>
          {!c && (
            <div className="overflow-hidden">
              <p className="text-[#e0e3e5] font-bold text-base leading-6 truncate">Admin</p>
              <p
                className="text-[#c6c6cd] text-xs tracking-[0.05em] leading-4 truncate"
                style={{ fontFamily: "JetBrains Mono, monospace" }}
              >
                Master Presenter
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
