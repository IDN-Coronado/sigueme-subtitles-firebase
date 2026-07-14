import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import useSongs from "../firebase/useSongs";
import { IconSearch, IconPlus, IconEdit, IconTrash } from "../components/Icons";

// ─── Song Card ────────────────────────────────────────────────────────────────

function SongCard({ song }) {
  const navigate = useNavigate();
  const body = Array.isArray(song.body) ? song.body : (song.body ? [song.body] : []);
  const preview = body.filter(l => l.trim()).slice(0, 4).join("\n");

  return (
    <div className="bg-[rgba(29,32,34,0.6)] backdrop-blur-md border border-[rgba(255,255,255,0.05)] rounded-lg p-4 flex flex-col gap-4 hover:border-[rgba(123,208,255,0.2)] transition-colors min-h-[251px]">
      {/* Badge + Actions */}
      <div className="flex items-start justify-between">
        <span
          className="bg-[rgba(0,166,224,0.2)] text-[#7bd0ff] text-xs font-medium tracking-[0.05em] px-2 py-0.5 rounded-sm uppercase leading-[15px]"
          style={{ fontFamily: "JetBrains Mono, monospace" }}
        >
          SONG
        </span>
        <div className="flex items-center gap-1">
          <button
            className="w-7 h-8 flex items-center justify-center text-[#6b7280] hover:text-[#e0e3e5] transition-colors rounded"
            onClick={() => navigate(`/song/${song.id}`)}
            title="Editar"
          >
            <IconEdit />
          </button>
          <button
            className="w-6 h-8 flex items-center justify-center text-[#6b7280] hover:text-red-400 transition-colors rounded"
            title="Eliminar"
          >
            <IconTrash />
          </button>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-[#e0e3e5] font-bold text-lg leading-6">
        {song.title}
      </h3>

      {/* Lyrics preview */}
      <div className="bg-[rgba(16,20,21,0.4)] border border-[rgba(69,70,77,0.15)] rounded p-4 flex-1">
        <p className="text-[#c6c6cd] text-[13px] leading-relaxed italic line-clamp-4">
          &ldquo;{preview || "Sin letra disponible"}&rdquo;
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span
          className="text-[#6b7280] text-xs tracking-[0.05em] uppercase leading-[17px]"
          style={{ fontFamily: "JetBrains Mono, monospace" }}
        >
          CANCIÓN
        </span>
        <Link
          to={`/song/${song.id}`}
          className="text-[#7bd0ff] text-sm font-medium hover:underline leading-[16px]"
        >
          Ver canción →
        </Link>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function Songs() {
  const { songs, filterByValue } = useSongs();
  const [currentSongs, setCurrentSongs] = useState(songs);
  const navigate = useNavigate();

  const searchSongs = useCallback(e => {
    const filtered = filterByValue(e.currentTarget.value);
    setCurrentSongs(filtered);
  }, [filterByValue]);

  useEffect(() => {
    setCurrentSongs(songs);
  }, [songs]);

  return (
    <>
      {/* Top App Bar */}
      <header className="sticky top-0 z-10 h-14 sm:h-16 bg-[#191c1e]/80 backdrop-blur-md border-b border-[rgba(69,70,77,0.3)] flex items-center justify-end px-4 sm:px-6">
        <button
          className="text-[#7bd0ff] font-medium text-sm sm:text-base"
          style={{ fontFamily: "JetBrains Mono, monospace" }}
        >
          Vista en Vivo
        </button>
      </header>

      {/* Page Content */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 bg-[#101415] flex flex-col gap-4 sm:gap-6">

        {/* Header & Tabs */}
        <div className="border-b border-[rgba(69,70,77,0.2)] pb-4 flex flex-col gap-4 sm:gap-6 min-w-0">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between min-w-0">
            <div className="min-w-0">
              <h2 className="text-[#e0e3e5] font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-10 sm:leading-[48px] lg:leading-[56px]">
                Canciones
              </h2>
              <p className="text-[#c6c6cd] text-sm sm:text-base leading-6 mt-1">
                Gestiona y accede a toda la lista de canciones para tus presentaciones.
              </p>
            </div>

            {/* Tab bar */}
            <div className="w-full xl:w-auto min-w-0 overflow-x-auto">
              <div className="bg-[rgba(29,32,34,0.4)] border border-[rgba(69,70,77,0.2)] rounded-lg p-1 inline-flex items-center min-w-min">
                <span className="bg-[#323537] text-[#e0e3e5] font-semibold text-sm sm:text-base px-3 sm:px-4 lg:px-6 py-2 rounded-[4px] cursor-default whitespace-nowrap">
                  Canciones
                </span>
                <Link to="/themes" className="text-[#c6c6cd] hover:text-[#e0e3e5] text-sm sm:text-base px-3 sm:px-4 lg:px-6 py-2 rounded transition-colors whitespace-nowrap">
                  Temas
                </Link>
                <span className="text-[rgba(198,198,205,0.35)] text-sm sm:text-base px-3 sm:px-4 lg:px-6 py-2 cursor-not-allowed select-none whitespace-nowrap">
                  Imágenes
                </span>
                <span className="text-[rgba(198,198,205,0.35)] text-sm sm:text-base px-3 sm:px-4 lg:px-6 py-2 cursor-not-allowed select-none whitespace-nowrap">
                  Biblia
                </span>
              </div>
            </div>
          </div>
          <div className="relative w-full max-w-[448px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <IconSearch />
            </span>
            <input
              type="text"
              placeholder="Buscar recursos..."
              className="bg-[#0b0f10] text-[#6b7280] placeholder-[#6b7280] text-sm sm:text-base rounded-xl pl-10 pr-4 sm:pr-6 py-2.5 w-full outline-none border border-[rgba(69,70,77,0.2)] focus:border-[#7bd0ff] transition-colors"
              onChange={searchSongs}
            />
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between gap-3 min-h-12 sm:h-14">
          <span className="text-[#c6c6cd] font-semibold text-sm sm:text-base leading-6">
            {currentSongs.length} recursos
          </span>
          <button
            onClick={() => navigate("/add")}
            className="flex items-center gap-2 bg-[rgba(123,208,255,0.08)] border border-[rgba(123,208,255,0.2)] text-[#e0e3e5] font-bold text-sm sm:text-base px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg hover:bg-[rgba(123,208,255,0.15)] transition-colors shrink-0"
          >
            <IconPlus color="#e0e3e5" />
            Añadir
            <span
              className="bg-[rgba(69,70,77,0.4)] text-[#c6c6cd] text-xs px-2 py-0.5 rounded-sm leading-[15px]"
              style={{ fontFamily: "JetBrains Mono, monospace" }}
            >
              {songs.length}
            </span>
          </button>
        </div>

        {/* Song Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {currentSongs.map(song => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      </main>
    </>
  );
}

export default Songs;
