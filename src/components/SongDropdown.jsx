import { useState, useEffect, useRef } from "react";

function SongDropdown({ songs, selectedSongs, savedSongs, onSelect }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
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

  // Alphabetical grouping, filter out already selected songs
  const filtered = songs
    .filter(song =>
      !selectedSongs.find(selected => selected.id === song.id) &&
      !savedSongs?.find(saved => saved.id === song.id) &&
      song.title.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => a.title.localeCompare(b.title));

  const grouped = filtered.reduce((acc, song) => {
    const letter = song.title[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(song);
    return acc;
  }, {});

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="border rounded px-3 py-2 w-full flex items-center justify-between"
        onClick={() => setOpen((v) => !v)}
      >
        Selecciona una canción
        <span className="ml-2">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="absolute z-20 bg-white border rounded shadow w-full mt-1 max-h-60 overflow-auto">
          <div className="p-2">
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border rounded px-2 py-1 w-full"
              autoFocus
            />
          </div>
          {Object.keys(grouped).sort().map(letter => (
            <div key={letter}>
              <div className="px-3 py-1 text-xs font-bold text-gray-500 bg-gray-50">{letter}</div>
              {grouped[letter].map(song => (
                <div
                  key={song.id}
                  className="px-3 py-2 hover:bg-cyan-50 cursor-pointer"
                  onClick={() => { onSelect(song.id); setOpen(false); }}
                >
                  {song.title}
                </div>
              ))}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-gray-400">No hay resultados</div>
          )}
        </div>
      )}
    </div>
  );
}

export default SongDropdown;